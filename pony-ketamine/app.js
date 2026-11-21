// Pony Ketamine — long hair + micro bangs, rendered in-browser.
// Face landmarks come from MediaPipe Face Landmarker; the haircut is drawn
// procedurally on a canvas in the colour sampled from the user's own hair.

import { sound } from './audio.js';

const MP_VER = '0.10.14';
const MP_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VER}`;
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400,
  377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];

const MAX_SIDE = 1600;

const $ = (id) => document.getElementById(id);
const screens = { start: $('screenStart'), camera: $('screenCamera'), result: $('screenResult') };
const out = $('out');
const octx = out.getContext('2d');

const state = {
  photo: null,       // canvas holding the original photo
  face: null,        // derived face geometry
  autoColor: null,   // [r,g,b] detected
  color: null,       // [r,g,b] in use
  seed: 1,
  showOriginal: false,
};

/* ─────────────────────────── screens ─────────────────────────── */

function show(name) {
  for (const [k, el] of Object.entries(screens)) el.classList.toggle('hidden', k !== name);
  if (name !== 'camera') stopCamera();
  if (name !== 'result') sound.stopBeat();
}

function busy(on, text) {
  $('busy').classList.toggle('hidden', !on);
  if (text) $('busyText').textContent = text;
}

function message(text) {
  $('msg').textContent = text || '';
  $('msg').classList.toggle('hidden', !text);
}

/* ─────────────────────────── model ─────────────────────────── */

let landmarkerPromise = null;
function getLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FaceLandmarker, FilesetResolver } = await import(`${MP_BASE}/vision_bundle.mjs`);
      const fileset = await FilesetResolver.forVisionTasks(`${MP_BASE}/wasm`);
      const opts = (delegate) => ({
        baseOptions: { modelAssetPath: MODEL_URL, delegate },
        runningMode: 'IMAGE',
        numFaces: 1,
      });
      try {
        return await FaceLandmarker.createFromOptions(fileset, opts('GPU'));
      } catch {
        return await FaceLandmarker.createFromOptions(fileset, opts('CPU'));
      }
    })();
    landmarkerPromise.catch(() => { landmarkerPromise = null; });
  }
  return landmarkerPromise;
}
// Warm up in the background so it's ready by the time a photo arrives.
getLandmarker().catch(() => {});

/* ─────────────────────────── camera ─────────────────────────── */

let stream = null;
let facing = 'user';

async function startCamera() {
  stopCamera();
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 1280 } },
      audio: false,
    });
  } catch (e) {
    show('start');
    alert('Could not open the camera. You can upload a photo instead.');
    return;
  }
  const v = $('video');
  v.srcObject = stream;
  v.classList.toggle('mirror', facing === 'user');
  show('camera');
}

function stopCamera() {
  if (stream) stream.getTracks().forEach((t) => t.stop());
  stream = null;
}

function snap() {
  const v = $('video');
  if (!v.videoWidth) return;
  const c = document.createElement('canvas');
  c.width = v.videoWidth;
  c.height = v.videoHeight;
  const cx = c.getContext('2d');
  if (facing === 'user') { cx.translate(c.width, 0); cx.scale(-1, 1); }
  cx.drawImage(v, 0, 0);
  stopCamera();
  processPhoto(c);
}

/* ─────────────────────────── photo pipeline ─────────────────────────── */

function toPhotoCanvas(src) {
  const sw = src.naturalWidth || src.videoWidth || src.width;
  const sh = src.naturalHeight || src.videoHeight || src.height;
  const k = Math.min(1, MAX_SIDE / Math.max(sw, sh));
  const c = document.createElement('canvas');
  c.width = Math.round(sw * k);
  c.height = Math.round(sh * k);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return c;
}

async function loadFile(file) {
  if (!file) return;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    processPhoto(bmp);
  } catch {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); processPhoto(img); };
    img.onerror = () => alert('That file does not look like a photo.');
    img.src = url;
  }
}

async function processPhoto(src) {
  state.photo = toPhotoCanvas(src);
  state.face = null;
  state.seed = (Math.random() * 1e9) | 0;
  out.width = state.photo.width;
  out.height = state.photo.height;
  octx.drawImage(state.photo, 0, 0);
  message('');
  show('result');
  $('controls').classList.add('hidden');
  busy(true, 'Sharpening the scissors…');

  let lm;
  try {
    const landmarker = await getLandmarker();
    busy(true, 'Finding your face…');
    const res = landmarker.detect(state.photo);
    lm = res.faceLandmarks && res.faceLandmarks[0];
  } catch (e) {
    console.error(e);
    busy(false);
    message('Could not load the face finder. Check your connection and try again.');
    return;
  }
  if (!lm) {
    busy(false);
    message('No face found. Try a well-lit, front-facing photo with your whole head in frame.');
    return;
  }

  state.face = faceGeometry(lm, state.photo.width, state.photo.height);
  state.autoColor = sampleHairColor(state.photo, state.face);
  state.color = state.autoColor;
  $('swAuto').style.background = rgb(state.autoColor);
  $('swAuto').classList.add('on');
  $('colorPick').value = toHex(state.autoColor);
  $('controls').classList.remove('hidden');
  busy(false);
  render();
  // the reveal: goth ta-da, then the beat creeps in underneath
  sound.tada();
  sound.startBeat(2.4);
}

/* ─────────────────────────── geometry ─────────────────────────── */

function faceGeometry(lm, w, h) {
  const P = (i) => ({ x: lm[i].x * w, y: lm[i].y * h });
  const top = P(10), chin = P(152);
  const eyeA = P(33), eyeB = P(263);
  const ang = Math.atan2(eyeB.y - eyeA.y, eyeB.x - eyeA.x);
  const H = Math.hypot(chin.x - top.x, chin.y - top.y);
  const W = Math.hypot(P(454).x - P(234).x, P(454).y - P(234).y);
  const c = { x: (top.x + chin.x) / 2, y: (top.y + chin.y) / 2 };
  const cos = Math.cos(ang), sin = Math.sin(ang);
  const toLocal = (p) => {
    const dx = p.x - c.x, dy = p.y - c.y;
    return { x: dx * cos + dy * sin, y: -dx * sin + dy * cos };
  };
  const toImg = (x, y) => ({ x: c.x + x * cos - y * sin, y: c.y + x * sin + y * cos });
  const browY = (toLocal(P(105)).y + toLocal(P(334)).y) / 2;
  const topY = toLocal(top).y;
  const oval = FACE_OVAL.map((i) => toLocal(P(i)));
  const skin = [P(50), P(280), P(151), P(9)];
  return { c, ang, W, H, toLocal, toImg, browY, topY, oval, skin, glabella: P(9) };
}

/* ─────────────────────────── hair colour ─────────────────────────── */

function sampleHairColor(photo, f) {
  const ctx = photo.getContext('2d', { willReadFrequently: true });
  const { width: w, height: h } = photo;
  const data = ctx.getImageData(0, 0, w, h).data;
  const px = (x, y) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= w || y >= h) return null;
    const i = (y * w + x) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  };

  // Skin reference: small patches around cheeks / forehead.
  const r = Math.max(2, f.W * 0.02);
  let sk = [0, 0, 0], n = 0;
  for (const p of f.skin) {
    for (let dy = -r; dy <= r; dy += Math.max(1, r / 3)) {
      for (let dx = -r; dx <= r; dx += Math.max(1, r / 3)) {
        const q = px(p.x + dx, p.y + dy);
        if (q) { sk[0] += q[0]; sk[1] += q[1]; sk[2] += q[2]; n++; }
      }
    }
  }
  sk = sk.map((v) => v / Math.max(1, n));

  const { W, H, topY } = f;
  const step = Math.max(1, Math.round(W / 90));

  // Forehead mask: grow outward from the skin between the eyebrows and stop
  // at strong colour edges (the hairline). Whatever is connected is skin,
  // however the forehead happens to be lit.
  const gx0 = -0.8 * W, gy0 = topY - 0.5 * H, gy1 = f.browY;
  const gs = Math.max(2, W / 45);
  const cols = Math.ceil(1.6 * W / gs) + 1, rows = Math.ceil((gy1 - gy0) / gs) + 1;
  const grid = new Array(cols * rows);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const p = f.toImg(gx0 + i * gs, gy0 + j * gs);
      grid[j * cols + i] = px(p.x, p.y);
    }
  }
  const skinMask = new Uint8Array(cols * rows);
  const seed = f.toLocal(f.glabella);
  const si = Math.round((seed.x - gx0) / gs), sj = Math.min(rows - 1, Math.round((seed.y - gy0) / gs));
  const seedC = grid[sj * cols + si];
  if (seedC) {
    const cd = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    const queue = [sj * cols + si];
    skinMask[queue[0]] = 1;
    while (queue.length) {
      const idx = queue.pop();
      const i = idx % cols, j = (idx / cols) | 0;
      const c = grid[idx];
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = i + di, nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= cols || nj >= rows) continue;
        const nIdx = nj * cols + ni;
        const nc = grid[nIdx];
        if (skinMask[nIdx] || !nc) continue;
        if (cd(nc, c) < 22 && cd(nc, seedC) < 220) { skinMask[nIdx] = 1; queue.push(nIdx); }
      }
    }
  }
  // Colour of the upper forehead (often lit differently from the cheeks).
  const skinRefs = [sk];
  if (seedC) skinRefs.push(seedC);
  let topRow = rows;
  for (let k = 0; k < skinMask.length; k++) if (skinMask[k]) { topRow = Math.floor(k / cols); break; }
  const upper = [0, 0, 0];
  let nu = 0;
  for (let j = topRow; j < Math.min(rows, topRow + Math.max(2, (rows - topRow) / 4)); j++) {
    for (let i = 0; i < cols; i++) {
      const c = grid[j * cols + i];
      if (skinMask[j * cols + i] && c) { upper[0] += c[0]; upper[1] += c[1]; upper[2] += c[2]; nu++; }
    }
  }
  if (nu > 3) skinRefs.push(upper.map((v) => v / nu));
  const nearSkin = (q) => skinRefs.some((r) => Math.hypot(q[0] - r[0], q[1] - r[1], q[2] - r[2]) < 48);

  const isForehead = (lx, ly) => {
    const i = Math.round((lx - gx0) / gs), j = Math.round((ly - gy0) / gs);
    if (i < 0 || j < 0 || i >= cols || j >= rows) return false;
    return skinMask[j * cols + i] === 1;
  };

  // Candidate hair regions in face-local space (x in W, y in H), with weights.
  const t = topY / H;
  const regions = [
    { x0: -0.3, x1: 0.3, y0: t - 0.2, y1: t - 0.03, wgt: 3 },   // just above the hairline
    { x0: -0.48, x1: -0.3, y0: t - 0.12, y1: t + 0.05, wgt: 2 },
    { x0: 0.3, x1: 0.48, y0: t - 0.12, y1: t + 0.05, wgt: 2 },
    { x0: -0.62, x1: -0.52, y0: t + 0.05, y1: -0.1, wgt: 2 },   // beside the temples
    { x0: 0.52, x1: 0.62, y0: t + 0.05, y1: -0.1, wgt: 2 },
  ];

  const bins = new Map();
  const pixels = [];
  // Pixels right above where the forehead ends are the most reliable hair.
  const add = (q, wgt) => {
    if (nearSkin(q)) return;
    const lum = 0.299 * q[0] + 0.587 * q[1] + 0.114 * q[2];
    const sat = Math.max(...q) - Math.min(...q);
    if (lum > 235 && sat < 18) return;
    const key = (q[0] >> 5) * 64 + (q[1] >> 5) * 8 + (q[2] >> 5);
    bins.set(key, (bins.get(key) || 0) + wgt * (1 + sat / 80) * (lum < 40 ? 0.5 : 1));
    pixels.push({ q, key, lum, wgt });
  };
  for (let i = 0; i < cols; i++) {
    let jTop = -1;
    for (let j = 0; j < rows; j++) if (skinMask[j * cols + i]) { jTop = j; break; }
    if (jTop < 2 || jTop > rows - 3) continue;
    for (let d = 1; d <= 3; d++) {
      const c = grid[(jTop - d) * cols + i];
      if (c) add(c, 4);
    }
  }

  for (const g of regions) {
    for (let ly = g.y0 * H; ly <= g.y1 * H; ly += step) {
      for (let lx = g.x0 * W; lx <= g.x1 * W; lx += step) {
        const p = f.toImg(lx, ly);
        const q = px(p.x, p.y);
        if (!q || isForehead(lx, ly)) continue;
        add(q, g.wgt);
      }
    }
  }
  if (!pixels.length) return [74, 48, 34]; // sensible brunette fallback

  // Dominant colour cluster (most common bin + neighbours)…
  let bestKey = 0, bestW = -1;
  for (const [k, wt] of bins) if (wt > bestW) { bestW = wt; bestKey = k; }
  const br = bestKey >> 6, bg = (bestKey >> 3) & 7, bb = bestKey & 7;
  const near = (k) => Math.abs((k >> 6) - br) <= 1 && Math.abs(((k >> 3) & 7) - bg) <= 1 && Math.abs((k & 7) - bb) <= 1;
  const cluster = pixels.filter((p) => near(p.key)).sort((a, b) => a.lum - b.lum);

  // …then the mid-to-light part of it. Shadows make hair read darker than it
  // looks to people, so skip the darkest pixels and the specular highlights.
  const median = cluster[Math.floor(cluster.length / 2)].lum;
  const [pLo, pHi] = median < 70 ? [0.35, 0.85] : [0.65, 0.98]; // black hair: don't drift toward brown
  const lo = Math.floor(cluster.length * pLo), hi = Math.max(lo + 1, Math.floor(cluster.length * pHi));
  const acc = [0, 0, 0];
  let wsum = 0;
  for (const p of cluster.slice(lo, hi)) {
    acc[0] += p.q[0] * p.wgt; acc[1] += p.q[1] * p.wgt; acc[2] += p.q[2] * p.wgt; wsum += p.wgt;
  }
  return acc.map((v) => Math.round(v / wsum));
}

/* ─────────────────────────── colour utils ─────────────────────────── */

const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const toHex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const fromHex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const shade = (c, k) => c.map((v) => (k >= 0 ? v + (255 - v) * k : v * (1 + k)));

/* ─────────────────────────── drawing helpers ─────────────────────────── */

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Catmull-Rom through control points → dense polyline.
function spline(pts, per = 12) {
  const outPts = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < per; s++) {
      const t = s / per, t2 = t * t, t3 = t2 * t;
      outPts.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  outPts.push(pts[pts.length - 1]);
  return outPts;
}

function poly(ctx, pts, move = true) {
  pts.forEach((p, i) => (i === 0 && move ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
}

function layer(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

/* ─────────────────────────── the haircut ─────────────────────────── */

function render() {
  const photo = state.photo;
  octx.setTransform(1, 0, 0, 1, 0, 0);
  octx.clearRect(0, 0, out.width, out.height);
  octx.drawImage(photo, 0, 0);
  if (!state.face || state.showOriginal) return;

  const f = state.face;
  const { W, H } = f;
  const color = state.color;
  const rand = mulberry32(state.seed);
  const opt = {
    bangs: +$('rBangs').value,   // 0 = right at the hairline, 1 = eyebrows
    length: +$('rLength').value, // tip height, in face heights below face centre
    volume: +$('rVolume').value,
  };
  const vol = opt.volume;

  const w = photo.width, h = photo.height;
  const toLocalCtx = (ctx) => {
    ctx.setTransform(Math.cos(f.ang), Math.sin(f.ang), -Math.sin(f.ang), Math.cos(f.ang), f.c.x, f.c.y);
  };

  // Skull-hugging silhouette: the crown sits just above the head, not a dome.
  const crownY = f.topY - 0.36 * H * (0.9 + 0.1 * vol);
  const L = opt.length * H;                  // where the longest strands end
  const bodyEnd = L - 0.14 * H;              // solid hair stops here; wisps go further
  const mid = (0.25 * H + L) / 2;
  // The top of the head as an ellipse, so the hair follows a round skull.
  const skull = { cy: f.topY + 0.15 * H, rx: 0.6 * W * vol };
  skull.ry = skull.cy - crownY;
  const onSkull = (deg, k = 1) => ({
    x: Math.cos((deg * Math.PI) / 180) * skull.rx * k,
    y: skull.cy - Math.sin((deg * Math.PI) / 180) * skull.ry,
  });

  /* ═════════ side hair ═════════ */
  const sideLayer = layer(w, h);
  const cc = sideLayer.getContext('2d');
  toLocalCtx(cc);

  const sides = [1, -1].map((s) => {
    const outer = spline([
      onSkull(90),
      onSkull(55),
      onSkull(22),
      { x: 0.62 * W * vol, y: -0.15 * H },
      { x: 0.63 * W * (0.5 + 0.5 * vol), y: 0.2 * H },
      { x: 0.66 * W * (0.6 + 0.4 * vol), y: mid },
      { x: 0.8 * W, y: L },
    ].map((p) => ({ x: p.x * s, y: p.y })), 16);
    const inner = spline([
      { x: 0.0, y: crownY + 0.06 * H },
      { x: 0.28 * W, y: onSkull(55).y + 0.08 * H },
      { x: 0.38 * W, y: f.topY + 0.05 * H },
      { x: 0.4 * W, y: -0.2 * H },
      { x: 0.4 * W, y: 0.22 * H },
      { x: 0.41 * W, y: mid },
      { x: 0.5 * W, y: L },
    ].map((p) => ({ x: p.x * s, y: p.y })), 16);
    return { s, outer, inner };
  });

  // Point on the strand that sits fraction t of the way from outer to inner edge.
  const at = (sd, t, k) => {
    const o = sd.outer[k], q = sd.inner[k];
    return { x: o.x + (q.x - o.x) * t, y: o.y + (q.y - o.y) * t };
  };

  // x on the line that is fraction t across the hair, at height y
  const xAt = (sd, t, y) => {
    let k = 0;
    while (k < sd.outer.length - 1 && sd.outer[k].y < y) k++;
    return sd.outer[k].x + (sd.inner[k].x - sd.outer[k].x) * t;
  };
  // Shaggy ends: the hair finishes in tapered, pointed pieces of different lengths.
  for (const sd of sides) {
    const nClumps = 9;
    sd.zig = [];
    for (let c = 0; c < nClumps; c++) {
      const t0 = c / nClumps, t1 = (c + 1) / nClumps;
      const valleyY = bodyEnd + rand() * 0.03 * H;
      const tipY = bodyEnd + 0.05 * H + Math.pow(rand(), 0.7) * 0.15 * H;
      const tm = t0 + (t1 - t0) * (0.35 + rand() * 0.3);
      sd.zig.push({ x: xAt(sd, t0, valleyY), y: valleyY });
      sd.zig.push({ x: xAt(sd, tm, tipY), y: tipY, tip: true });
    }
    const lastY = bodyEnd + rand() * 0.03 * H;
    sd.zig.push({ x: xAt(sd, 1, lastY), y: lastY });
  }
  cc.beginPath();
  for (const sd of sides) {
    const y0 = sd.zig[0].y, y1 = sd.zig[sd.zig.length - 1].y;
    poly(cc, sd.outer.filter((p) => p.y < y0));
    // tapered pieces: curve into each point so they look like hair, not teeth
    for (let z = 0; z < sd.zig.length - 1; z++) {
      const a = sd.zig[z], b = sd.zig[z + 1];
      if (b.tip) cc.quadraticCurveTo(a.x + (b.x - a.x) * 0.3, b.y - (b.y - a.y) * 0.25, b.x, b.y);
      else cc.quadraticCurveTo(b.x - (b.x - a.x) * 0.3, a.y - (a.y - b.y) * 0.25, b.x, b.y);
    }
    poly(cc, sd.inner.filter((p) => p.y < y1).reverse(), false);
    cc.closePath();
  }
  cc.fillStyle = rgb(color);
  cc.fill();

  cc.globalCompositeOperation = 'source-atop';
  paintHairShading(cc, f, color, crownY, L);
  // glossy sheen streak + soft shadow where the hair tucks in by the face
  cc.save();
  cc.filter = `blur(${Math.max(2, W * 0.035)}px)`;
  cc.lineCap = 'round';
  const n0 = sides[0].outer.length;
  const run = (sd, t, a, b) => {
    const pts = [];
    for (let k = Math.floor(a * (n0 - 1)); k <= Math.floor(b * (n0 - 1)); k++) pts.push(at(sd, t, k));
    return pts;
  };
  for (const sd of sides) {
    cc.strokeStyle = rgb(shade(color, 0.55), 0.3);
    cc.lineWidth = W * 0.1;
    cc.beginPath(); poly(cc, run(sd, 0.45, 0.1, 0.5)); cc.stroke();
    cc.strokeStyle = rgb(shade(color, -0.45), 0.22);
    cc.lineWidth = W * 0.07;
    cc.beginPath(); poly(cc, run(sd, 0.95, 0.3, 1)); cc.stroke();
  }
  cc.restore();
  cc.globalCompositeOperation = 'source-over';

  // Strand texture, kept inside the hair so it reads as shine, not bristles.
  cc.globalCompositeOperation = 'source-atop';
  cc.lineCap = 'round';
  for (const sd of sides) {
    for (let i = 0; i < 300; i++) {
      const t = rand();
      const wav = (rand() - 0.5) * 0.025 * W;
      const ph = rand() * Math.PI * 2;
      cc.strokeStyle = rgb(shade(color, (rand() - 0.45) * 0.4), 0.2 + rand() * 0.25);
      cc.lineWidth = W * (0.003 + rand() * 0.007);
      cc.beginPath();
      for (let k = 0; k < n0; k++) {
        const p = at(sd, t, k);
        const x = p.x + Math.sin(k * 0.18 + ph) * wav;
        k ? cc.lineTo(x, p.y) : cc.moveTo(x, p.y);
      }
      cc.lineTo(xAt(sd, t, L + 0.1 * H), L + 0.1 * H);
      cc.stroke();
    }
  }
  cc.globalCompositeOperation = 'source-over';
  for (const sd of sides) {
    // a few fine wisps trailing off the pointed ends
    for (const z of sd.zig.filter((p) => p.tip)) {
      for (let i = 0; i < 2; i++) {
        cc.strokeStyle = rgb(shade(color, (rand() - 0.4) * 0.3), 0.35);
        cc.lineWidth = W * (0.002 + rand() * 0.002);
        cc.beginPath();
        cc.moveTo(z.x, z.y - 0.06 * H);
        cc.quadraticCurveTo(z.x + (rand() - 0.5) * 0.02 * W, z.y, z.x + (rand() - 0.5) * 0.03 * W, z.y + (0.01 + rand() * 0.04) * H);
        cc.stroke();
      }
    }
    // flyaways just outside the silhouette
    for (let i = 0; i < 14; i++) {
      const t = -0.03 - rand() * 0.05;
      const a = 0.15 + rand() * 0.2, b = 0.6 + rand() * 0.35;
      const ph = rand() * 6;
      cc.strokeStyle = rgb(shade(color, (rand() - 0.3) * 0.3), 0.2 + rand() * 0.2);
      cc.lineWidth = W * (0.0015 + rand() * 0.002);
      cc.beginPath();
      run(sd, t, a, b).forEach((p, k) => {
        const x = p.x + Math.sin(k * 0.2 + ph) * 0.012 * W * sd.s;
        k ? cc.lineTo(x, p.y) : cc.moveTo(x, p.y);
      });
      cc.stroke();
    }
  }

  // carve the face out (narrowed a little so hair overlaps the cheeks)
  cc.globalCompositeOperation = 'destination-out';
  cc.beginPath();
  poly(cc, f.oval.map((p) => ({ x: p.x * (p.y > f.topY + 0.15 * H ? 0.9 : 1), y: p.y })));
  cc.closePath();
  cc.fillStyle = '#000';
  cc.filter = `blur(${Math.max(1, W * 0.006)}px)`;
  cc.fill();
  cc.filter = 'none';
  cc.globalCompositeOperation = 'source-over';

  /* ═════════ micro bangs ═════════ */
  const bangLayer = layer(w, h);
  const bc = bangLayer.getContext('2d');
  toLocalCtx(bc);
  const yb = f.topY + (f.browY - f.topY) * opt.bangs;  // where the fringe ends
  const halfB = 0.49 * W;
  // The fringe follows the curve of the forehead and kicks up a touch at the temples.
  const edgeY = (x) => yb - Math.pow(Math.abs(x) / halfB, 2) * 0.03 * H - Math.pow(Math.abs(x) / halfB, 6) * 0.025 * H;

  // Cut into "pieces", each a slightly different length: blunt but textured.
  const pieces = [];
  const nPieces = 15;
  for (let i = 0; i < nPieces; i++) {
    pieces.push({
      x0: -halfB + (2 * halfB * i) / nPieces,
      x1: -halfB + (2 * halfB * (i + 1)) / nPieces,
      dy: (rand() - 0.5) * 0.014 * H,
    });
  }
  // Bottom edge: each piece ends in one or two short points.
  const edge = [];
  for (let p = pieces.length - 1; p >= 0; p--) {
    const pc = pieces[p];
    const pts = 1 + (rand() < 0.45 ? 1 : 0);
    edge.push({ x: pc.x1, y: edgeY(pc.x1) + pc.dy - 0.005 * H });
    for (let k = 0; k < pts; k++) {
      const x = pc.x1 - (pc.x1 - pc.x0) * ((k + 0.5 + (rand() - 0.5) * 0.4) / pts);
      edge.push({ x, y: edgeY(x) + pc.dy + 0.002 * H + rand() * 0.005 * H, tip: true });
    }
  }
  edge.push({ x: pieces[0].x0, y: edgeY(pieces[0].x0) + pieces[0].dy - 0.005 * H });

  const bangTop = spline([
    { x: -halfB * 1.04, y: edgeY(-halfB) - 0.02 * H },
    onSkull(160, 0.97), onSkull(125, 0.97), onSkull(90), onSkull(55, 0.97), onSkull(20, 0.97),
    { x: halfB * 1.04, y: edgeY(halfB) - 0.02 * H },
  ]);
  bc.beginPath();
  poly(bc, bangTop);
  for (const e of edge) bc.lineTo(e.x, e.y);
  bc.closePath();
  bc.fillStyle = rgb(color);
  bc.fill();

  bc.globalCompositeOperation = 'source-atop';
  const g = bc.createLinearGradient(0, crownY, 0, yb);
  g.addColorStop(0, rgb(shade(color, -0.3), 0.3));
  g.addColorStop(0.4, rgb(shade(color, 0.35), 0.28));
  g.addColorStop(0.65, rgb(color, 0));
  g.addColorStop(1, rgb(shade(color, -0.2), 0.2));
  bc.fillStyle = g;
  bc.fillRect(-W, crownY - H, 2 * W, yb - crownY + 2 * H);

  // strand texture combed from the crown, clipped to the fringe
  bc.lineCap = 'round';
  for (let i = 0; i < 300; i++) {
    const xb = -halfB * 1.05 + rand() * 2.1 * halfB;
    const yEnd = edgeY(xb) + 0.03 * H;
    const x0 = xb * 0.45;
    const y0 = crownY + 0.02 * H;
    bc.strokeStyle = rgb(shade(color, (rand() - 0.45) * 0.35), 0.2 + rand() * 0.25);
    bc.lineWidth = W * (0.003 + rand() * 0.007);
    bc.beginPath();
    bc.moveTo(x0, y0);
    bc.quadraticCurveTo(xb * 1.04, (y0 + yEnd) / 2, xb, yEnd);
    bc.stroke();
  }
  // darker separations between the pieces
  for (const pc of pieces) {
    const x = pc.x0;
    bc.strokeStyle = rgb(shade(color, -0.35), 0.35);
    bc.lineWidth = W * 0.004;
    bc.beginPath();
    bc.moveTo(x * 0.92, edgeY(x) - 0.07 * H);
    bc.lineTo(x, edgeY(x) + 0.02 * H);
    bc.stroke();
  }
  bc.globalCompositeOperation = 'source-over';

  /* ═════════ composite ═════════ */
  octx.save();
  octx.shadowColor = 'rgba(0,0,0,0.3)';
  octx.shadowBlur = W * 0.045;
  octx.shadowOffsetY = W * 0.01;
  octx.drawImage(sideLayer, 0, 0);
  octx.shadowColor = 'rgba(0,0,0,0.28)';
  octx.shadowBlur = W * 0.02;
  octx.shadowOffsetY = W * 0.01;
  octx.drawImage(bangLayer, 0, 0);
  octx.restore();
}

function paintHairShading(ctx, f, color, crownY, L) {
  const { W, H } = f;
  // slightly deeper roots → sheen → even mid-lengths → sun-lightened ends
  const g = ctx.createLinearGradient(0, crownY, 0, L);
  g.addColorStop(0, rgb(shade(color, -0.3), 0.3));
  g.addColorStop(0.15, rgb(shade(color, 0.3), 0.2));
  g.addColorStop(0.3, rgb(color, 0));
  g.addColorStop(0.8, rgb(color, 0));
  g.addColorStop(1, rgb(shade(color, 0.15), 0.2));
  ctx.fillStyle = g;
  ctx.fillRect(-2 * W, crownY - H, 4 * W, L - crownY + 2 * H);

  // a touch of depth where the hair meets the face and at the outer edge
  for (const s of [1, -1]) {
    const gh = ctx.createLinearGradient(0.38 * W * s, 0, 0.75 * W * s, 0);
    gh.addColorStop(0, rgb(shade(color, -0.4), 0.4));
    gh.addColorStop(0.35, rgb(color, 0));
    gh.addColorStop(0.85, rgb(color, 0));
    gh.addColorStop(1, rgb(shade(color, -0.25), 0.25));
    ctx.fillStyle = gh;
    ctx.fillRect(Math.min(0.38 * W * s, 0.8 * W * s), f.topY, 0.42 * W, L);
  }
}

/* ─────────────────────────── events ─────────────────────────── */

$('btnSelfie').onclick = () => {
  sound.unlock();
  if (!navigator.mediaDevices?.getUserMedia) {
    $('fileInput').setAttribute('capture', 'user');
    $('fileInput').click();
    return;
  }
  facing = 'user';
  startCamera();
};
// The file picker's change event doesn't count as a tap on iOS, so unlock
// audio when the upload button itself is pressed.
$('fileInput').closest('label').addEventListener('pointerdown', () => sound.unlock());
$('fileInput').onchange = (e) => {
  loadFile(e.target.files[0]);
  e.target.value = '';
  e.target.removeAttribute('capture');
};
$('btnCamCancel').onclick = () => show('start');
$('btnSnap').onclick = () => { sound.unlock(); snap(); };
$('btnFlip').onclick = () => { facing = facing === 'user' ? 'environment' : 'user'; startCamera(); };
$('btnAgain').onclick = () => show('start');

for (const id of ['rBangs', 'rLength', 'rVolume']) {
  $(id).addEventListener('input', () => requestAnimationFrame(render));
}
$('swAuto').onclick = () => {
  if (!state.autoColor) return;
  state.color = state.autoColor;
  $('colorPick').value = toHex(state.autoColor);
  $('swAuto').classList.add('on');
  render();
};
$('colorPick').addEventListener('input', (e) => {
  state.color = fromHex(e.target.value);
  $('swAuto').classList.remove('on');
  requestAnimationFrame(render);
});

const peek = (on) => { state.showOriginal = on; render(); };
const pk = $('btnPeek');
pk.addEventListener('pointerdown', (e) => { e.preventDefault(); peek(true); });
for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) pk.addEventListener(ev, () => peek(false));

$('btnSave').onclick = () => {
  out.toBlob(async (blob) => {
    const file = new File([blob], 'pony-ketamine.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Pony Ketamine' }); return; } catch {}
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pony-ketamine.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }, 'image/png');
};

const sndBtn = $('btnSound');
const paintSound = () => {
  sndBtn.textContent = sound.muted ? 'Sound off' : 'Sound on';
  sndBtn.setAttribute('aria-pressed', String(!sound.muted));
};
sndBtn.onclick = () => {
  sound.unlock();
  sound.setMuted(!sound.muted);
  paintSound();
};
paintSound();
