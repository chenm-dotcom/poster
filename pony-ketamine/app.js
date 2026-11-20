// Pony Ketamine — long hair + micro bangs, rendered in-browser.
// Face landmarks come from MediaPipe Face Landmarker; the haircut is drawn
// procedurally on a canvas in the colour sampled from the user's own hair.

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
  return { c, ang, W, H, toLocal, toImg, browY, topY, oval, skin };
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

  // Candidate hair regions in face-local space (x in W, y in H), with weights.
  const { W, H, topY } = f;
  const regions = [
    { x0: -0.28, x1: 0.28, y0: topY / H - 0.30, y1: topY / H - 0.08, wgt: 4 }, // above hairline
    { x0: -0.45, x1: -0.3, y0: topY / H - 0.22, y1: topY / H - 0.02, wgt: 2 },
    { x0: 0.3, x1: 0.45, y0: topY / H - 0.22, y1: topY / H - 0.02, wgt: 2 },
    { x0: -0.6, x1: -0.52, y0: -0.4, y1: -0.1, wgt: 1 },                     // temples
    { x0: 0.52, x1: 0.6, y0: -0.4, y1: -0.1, wgt: 1 },
  ];

  const bins = new Map();
  const pixels = [];
  const step = Math.max(1, Math.round(W / 90));
  for (const g of regions) {
    for (let ly = g.y0 * H; ly <= g.y1 * H; ly += step) {
      for (let lx = g.x0 * W; lx <= g.x1 * W; lx += step) {
        const p = f.toImg(lx, ly);
        const q = px(p.x, p.y);
        if (!q) continue;
        const dSkin = Math.hypot(q[0] - sk[0], q[1] - sk[1], q[2] - sk[2]);
        if (dSkin < 55) continue;                 // looks like skin
        const lum = 0.299 * q[0] + 0.587 * q[1] + 0.114 * q[2];
        const sat = Math.max(...q) - Math.min(...q);
        if (lum > 235 && sat < 18) continue;      // blown-out / white wall
        const key = (q[0] >> 5) * 64 + (q[1] >> 5) * 8 + (q[2] >> 5);
        bins.set(key, (bins.get(key) || 0) + g.wgt);
        pixels.push({ q, key, lum, wgt: g.wgt });
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
  const lo = Math.floor(cluster.length * 0.45), hi = Math.max(lo + 1, Math.floor(cluster.length * 0.9));
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
    bangs: +$('rBangs').value,   // 0 = right at hairline, 1 = eyebrows
    length: +$('rLength').value, // in face heights below face centre
    volume: +$('rVolume').value,
  };

  const w = photo.width, h = photo.height;
  const toLocalCtx = (ctx) => {
    ctx.setTransform(Math.cos(f.ang), Math.sin(f.ang), -Math.sin(f.ang), Math.cos(f.ang), f.c.x, f.c.y);
  };

  const crownY = f.topY - 0.46 * H * (0.85 + 0.15 * opt.volume);
  const L = opt.length * H;
  const vol = opt.volume;
  const mid = (0.3 * H + L) / 2;

  /* ── long side curtains ── */
  const curtains = layer(w, h);
  const cc = curtains.getContext('2d');
  toLocalCtx(cc);

  const sides = [1, -1].map((s) => {
    const outer = spline([
      { x: 0.0, y: crownY },
      { x: 0.42 * W * vol, y: crownY + 0.07 * H },
      { x: 0.64 * W * vol, y: f.topY - 0.08 * H },
      { x: 0.72 * W * vol, y: -0.2 * H },
      { x: 0.74 * W * (0.6 + 0.4 * vol), y: 0.25 * H },
      { x: 0.79 * W * (0.7 + 0.3 * vol), y: mid },
      { x: 0.8 * W, y: L - 0.06 * H },
    ].map((p) => ({ x: p.x * s, y: p.y })));
    const inner = spline([
      { x: 0.0, y: crownY + 0.08 * H },
      { x: 0.26 * W, y: crownY + 0.14 * H },
      { x: 0.38 * W, y: f.topY + 0.05 * H },
      { x: 0.4 * W, y: -0.2 * H },
      { x: 0.4 * W, y: 0.25 * H },
      { x: 0.42 * W, y: mid },
      { x: 0.46 * W, y: L + 0.02 * H },
    ].map((p) => ({ x: p.x * s, y: p.y })));
    // Choppy, layered ends between the two edge tips.
    const a = outer[outer.length - 1], b = inner[inner.length - 1];
    const tips = [];
    const n = 9;
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t + Math.sin(t * Math.PI) * 0.07 * H + (i % 2 ? 0.035 : -0.015) * H * (0.6 + rand() * 0.8);
      tips.push({ x, y });
    }
    return { s, outer, inner, tips };
  });

  const curtainPath = () => {
    cc.beginPath();
    for (const sd of sides) {
      poly(cc, sd.outer);
      poly(cc, sd.tips, false);
      poly(cc, [...sd.inner].reverse(), false);
      cc.closePath();
    }
  };

  // base
  curtainPath();
  cc.fillStyle = rgb(color);
  cc.fill();
  cc.globalCompositeOperation = 'source-atop';
  paintHairShading(cc, f, color, crownY, L, rand);

  // glossy sheen streak running down each side
  const along = (sd, t, from = 0, to = 1) => {
    const n = sd.outer.length;
    const pts = [];
    for (let k = Math.floor(from * (n - 1)); k <= Math.floor(to * (n - 1)); k++) {
      const o = sd.outer[k], q = sd.inner[k];
      pts.push({ x: o.x + (q.x - o.x) * t, y: o.y + (q.y - o.y) * t });
    }
    return pts;
  };
  cc.save();
  cc.filter = `blur(${Math.max(2, W * 0.035)}px)`;
  cc.lineCap = 'round';
  for (const sd of sides) {
    cc.strokeStyle = rgb(shade(color, 0.5), 0.28);
    cc.lineWidth = W * 0.11;
    cc.beginPath(); poly(cc, along(sd, 0.4, 0.12, 0.55)); cc.stroke();
    cc.strokeStyle = rgb(shade(color, -0.5), 0.3);
    cc.lineWidth = W * 0.08;
    cc.beginPath(); poly(cc, along(sd, 0.92, 0.3, 1)); cc.stroke();
  }
  cc.restore();

  // strands that follow the flow between outer and inner edges
  for (const sd of sides) {
    const N = 260;
    for (let i = 0; i < N; i++) {
      const t = rand();
      const wav = (rand() - 0.5) * 0.04 * W;
      const ph = rand() * Math.PI * 2;
      const lgt = (rand() - 0.5) * 0.5;
      cc.strokeStyle = rgb(shade(color, lgt), 0.18 + rand() * 0.22);
      cc.lineWidth = W * (0.002 + rand() * 0.006);
      cc.beginPath();
      for (let k = 0; k < sd.outer.length; k++) {
        const o = sd.outer[k], q = sd.inner[k];
        const x = o.x + (q.x - o.x) * t + Math.sin(k * 0.25 + ph) * wav;
        const y = o.y + (q.y - o.y) * t;
        k ? cc.lineTo(x, y) : cc.moveTo(x, y);
      }
      cc.lineTo(sd.tips[Math.min(sd.tips.length - 1, Math.floor(t * sd.tips.length))].x,
        sd.tips[Math.min(sd.tips.length - 1, Math.floor(t * sd.tips.length))].y + 0.04 * H);
      cc.stroke();
    }
  }

  // a few flyaways past the silhouette so the edge isn't a cut-out
  cc.globalCompositeOperation = 'source-over';
  for (const sd of sides) {
    for (let i = 0; i < 16; i++) {
      const t = -0.04 - rand() * 0.05;
      const pts = along(sd, t, 0.15 + rand() * 0.2, 0.75 + rand() * 0.25);
      const ph = rand() * 6;
      cc.strokeStyle = rgb(shade(color, (rand() - 0.3) * 0.3), 0.25 + rand() * 0.2);
      cc.lineWidth = W * (0.0015 + rand() * 0.002);
      cc.beginPath();
      pts.forEach((p, k) => {
        const x = p.x + Math.sin(k * 0.2 + ph) * 0.012 * W * sd.s;
        k ? cc.lineTo(x, p.y) : cc.moveTo(x, p.y);
      });
      cc.stroke();
    }
  }

  // carve the face out (slightly narrowed so hair overlaps the face edges)
  cc.globalCompositeOperation = 'destination-out';
  cc.beginPath();
  const ovalPts = f.oval.map((p) => ({ x: p.x * (p.y > f.topY + 0.15 * H ? 0.9 : 1), y: p.y }));
  poly(cc, ovalPts);
  cc.closePath();
  cc.fillStyle = '#000';
  cc.filter = `blur(${Math.max(1, W * 0.006)}px)`;
  cc.fill();
  cc.filter = 'none';
  cc.globalCompositeOperation = 'source-over';

  /* ── micro bangs ── */
  const bangsLayer = layer(w, h);
  const bc = bangsLayer.getContext('2d');
  toLocalCtx(bc);
  const yb = f.topY + (f.browY - f.topY) * opt.bangs; // blunt edge height
  const halfB = 0.47 * W;
  const bottom = [];
  const segs = 34;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const x = halfB - 2 * halfB * t;
    const curve = -Math.pow(x / halfB, 2) * 0.035 * H;        // follows the forehead
    const chop = (rand() - 0.5) * 0.018 * H;                  // blunt but choppy
    bottom.push({ x, y: yb + curve + chop });
  }
  const bangsTop = spline([
    { x: -0.52 * W * (0.9 + 0.1 * vol), y: yb - 0.04 * H },
    { x: -0.5 * W * vol, y: f.topY - 0.14 * H },
    { x: -0.3 * W * vol, y: crownY + 0.05 * H },
    { x: 0, y: crownY - 0.01 * H },
    { x: 0.3 * W * vol, y: crownY + 0.05 * H },
    { x: 0.5 * W * vol, y: f.topY - 0.14 * H },
    { x: 0.52 * W * (0.9 + 0.1 * vol), y: yb - 0.04 * H },
  ]);
  bc.beginPath();
  poly(bc, bangsTop);
  poly(bc, bottom, false);
  bc.closePath();
  bc.fillStyle = rgb(color);
  bc.fill();

  bc.globalCompositeOperation = 'source-atop';
  // roots darker, a sheen band, darker toward the cut line
  const g = bc.createLinearGradient(0, crownY, 0, yb);
  g.addColorStop(0, rgb(shade(color, -0.35), 0.4));
  g.addColorStop(0.45, rgb(shade(color, 0.22), 0.25));
  g.addColorStop(0.7, rgb(color, 0));
  g.addColorStop(1, rgb(shade(color, -0.3), 0.35));
  bc.fillStyle = g;
  bc.fillRect(-W, crownY - H, 2 * W, yb - crownY + 2 * H);

  // strands radiating from the crown down to the blunt edge
  const NB = 230;
  for (let i = 0; i < NB; i++) {
    const t = rand();
    const xb = halfB - 2 * halfB * t + (rand() - 0.5) * 0.01 * W;
    const x0 = xb * 0.25;
    const lgt = (rand() - 0.5) * 0.55;
    bc.strokeStyle = rgb(shade(color, lgt), 0.2 + rand() * 0.25);
    bc.lineWidth = W * (0.002 + rand() * 0.005);
    bc.beginPath();
    bc.moveTo(x0, crownY);
    bc.quadraticCurveTo(xb * 1.05, (crownY + yb) / 2, xb, yb + 0.02 * H);
    bc.stroke();
  }
  bc.globalCompositeOperation = 'source-over';

  /* ── composite ── */
  octx.save();
  octx.shadowColor = 'rgba(0,0,0,0.35)';
  octx.shadowBlur = W * 0.05;
  octx.shadowOffsetY = W * 0.01;
  octx.drawImage(curtains, 0, 0);
  octx.shadowBlur = W * 0.025;
  octx.shadowOffsetY = W * 0.012;
  octx.shadowColor = 'rgba(0,0,0,0.4)';
  octx.drawImage(bangsLayer, 0, 0);
  octx.restore();
}

function paintHairShading(ctx, f, color, crownY, L, rand) {
  const { W, H } = f;
  // vertical: dark roots → sheen → slightly lighter ends
  const g = ctx.createLinearGradient(0, crownY, 0, L);
  g.addColorStop(0, rgb(shade(color, -0.4), 0.4));
  g.addColorStop(0.18, rgb(shade(color, 0.25), 0.25));
  g.addColorStop(0.3, rgb(color, 0));
  g.addColorStop(0.75, rgb(shade(color, -0.15), 0.25));
  g.addColorStop(1, rgb(shade(color, 0.12), 0.25));
  ctx.fillStyle = g;
  ctx.fillRect(-2 * W, crownY - H, 4 * W, L - crownY + 2 * H);

  // horizontal: darker where hair tucks in next to the face/neck
  for (const s of [1, -1]) {
    const gh = ctx.createLinearGradient(0.38 * W * s, 0, 0.85 * W * s, 0);
    gh.addColorStop(0, rgb(shade(color, -0.45), 0.55));
    gh.addColorStop(0.35, rgb(color, 0));
    gh.addColorStop(0.85, rgb(color, 0));
    gh.addColorStop(1, rgb(shade(color, -0.3), 0.35));
    ctx.fillStyle = gh;
    const x0 = Math.min(0.38 * W * s, 0.9 * W * s);
    ctx.fillRect(x0, f.topY, 0.52 * W, L);
  }
}

/* ─────────────────────────── events ─────────────────────────── */

$('btnSelfie').onclick = () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    $('fileInput').setAttribute('capture', 'user');
    $('fileInput').click();
    return;
  }
  facing = 'user';
  startCamera();
};
$('fileInput').onchange = (e) => {
  loadFile(e.target.files[0]);
  e.target.value = '';
  e.target.removeAttribute('capture');
};
$('btnCamCancel').onclick = () => show('start');
$('btnSnap').onclick = snap;
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
