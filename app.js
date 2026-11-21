// Pony Ketamine — long hair + micro bangs, by an AI stylist.
// The face is checked on-device first (MediaPipe), so photos without a face
// never use up one of the free AI cuts. The edit itself runs on Higgsfield
// via our Worker (../worker/index.js), which also enforces the usage cap.

import { sound } from './audio.js';
import { drawCut } from './demo.js';

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
  photo: null,        // canvas holding the original photo
  result: null,       // the AI haircut (Image)
  showOriginal: false,
  quota: null,        // { used, limit, remaining, paused }
  run: 0,             // bumps when the user starts over, cancelling a pending wait
  demo: false,        // no AI server reachable → drawn stand-in haircut
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

/* ─────────────────────────── loading photos ─────────────────────────── */

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


/* ─────────────────────────── AI stylist ─────────────────────────── */

// Same-origin by default (the Worker serves both). Override with
// <meta name="pk-api" content="https://…"> if the pages are hosted elsewhere.
const API = (document.querySelector('meta[name="pk-api"]')?.content || '').replace(/\/$/, '');

const WAIT_LINES = [
  'Sharpening the scissors…',
  'Cutting your micro bangs…',
  'Shorter. Even shorter.',
  'Growing the rest down to your shoulders…',
  'Matching your hair colour…',
  'Adding Berlin attitude…',
  'Almost there. Stay goth.',
];

async function api(path, init) {
  const res = await fetch(API + path, init);
  let data = {};
  try { data = await res.json(); } catch {}
  return { ok: res.ok, status: res.status, data };
}

async function refreshQuota() {
  try {
    const { ok, data } = await api('/api/quota');
    if (!ok || typeof data.limit !== 'number') throw new Error();
    state.quota = data;
    state.demo = false;
  } catch {
    state.quota = null; // API not deployed (e.g. GitHub Pages preview)
    state.demo = true;
  }
  paintQuota();
  return state.quota;
}

function paintQuota() {
  const q = state.quota;
  const el = $('quota');
  const closed = q && q.paused;
  $('screenClosed').classList.toggle('hidden', !closed);
  if (closed) {
    for (const k of ['start', 'camera', 'result']) screens[k].classList.add('hidden');
    stopCamera();
    sound.stopBeat();
  }
  const fine = document.querySelector('#screenStart .fine');
  if (fine) {
    fine.innerHTML = state.demo
      ? 'Demo: your photo stays on your phone.<br>No photos on the dancefloor.'
      : "Your photo goes to our AI stylist only to make your cut. We don't keep it.<br>No photos on the dancefloor.";
  }
  if (!q) { el.textContent = state.demo ? 'Demo mode — AI not connected' : ''; return; }
  el.textContent = `${q.remaining} of ${q.limit} free cuts left`;
}

// A short colour description to steer the AI (it still looks at the photo).
function colorName([r, g, b]) {
  const max = Math.max(r, g, b) / 255, min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  const s = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (max !== min) {
    const d = max - min, R = r / 255, G = g / 255, B = b / 255;
    h = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  if (l < 0.13) return 'black';
  if (s < 0.12) return l > 0.7 ? 'white or silver' : l > 0.45 ? 'grey' : 'dark ash brown';
  if (h > 290 || h < 8) return s > 0.45 ? 'pink or magenta dyed' : 'auburn';
  if (h >= 160 && h <= 290) return h < 200 ? 'teal dyed' : h < 250 ? 'blue dyed' : 'purple dyed';
  if (h >= 70 && h < 160) return 'green dyed';
  if (h < 28 && s > 0.45 && l > 0.3) return 'copper red';
  if (l < 0.25) return 'dark brown';
  if (l < 0.38) return 'medium brown';
  if (l < 0.52) return h < 30 ? 'light auburn brown' : 'light brown';
  if (l < 0.66) return 'dark blonde';
  return 'light blonde';
}

function photoForUpload() {
  const p = state.photo;
  const k = Math.min(1, 1536 / Math.max(p.width, p.height));
  const c = document.createElement('canvas');
  c.width = Math.round(p.width * k);
  c.height = Math.round(p.height * k);
  c.getContext('2d').drawImage(p, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.9);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function drawResult() {
  const img = state.showOriginal ? state.photo : state.result;
  if (!img) return;
  octx.setTransform(1, 0, 0, 1, 0, 0);
  octx.fillStyle = '#e8e1d4';
  octx.fillRect(0, 0, out.width, out.height);
  // fit the original into the result's frame so before/after line up
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const k = Math.min(out.width / iw, out.height / ih);
  const w = iw * k, h = ih * k;
  octx.drawImage(img, (out.width - w) / 2, (out.height - h) / 2, w, h);
}

function reveal(img) {
  state.result = img;
  out.width = img.naturalWidth || img.width;
  out.height = img.naturalHeight || img.height;
  drawResult();
  busy(false);
  $('resultActions').classList.remove('hidden');
  $('btnPeek').classList.remove('hidden');
  $('btnSave').classList.remove('hidden');
  // the reveal: goth ta-da, then the beat creeps in underneath
  sound.tada();
  sound.startBeat(2.4);
}

// Preview without the AI server: a drawn haircut on the user's own photo.
async function demoCut(run, face, hairRgb) {
  for (const line of WAIT_LINES.slice(0, 3)) {
    busy(true, line);
    await sleep(1300);
    if (run !== state.run) return;
  }
  reveal(drawCut(state.photo, face, hairRgb, (Math.random() * 1e9) | 0));
  message('Demo mode: this cut is drawn on your phone. The real app uses an AI stylist for a photo-real result.');
}

/* ─────────────────────────── photo pipeline ─────────────────────────── */

async function processPhoto(src) {
  const run = ++state.run;
  state.photo = toPhotoCanvas(src);
  state.result = null;
  out.width = state.photo.width;
  out.height = state.photo.height;
  octx.drawImage(state.photo, 0, 0);
  message('');
  show('result');
  $('resultActions').classList.add('hidden');
  $('btnPeek').classList.add('hidden');
  $('btnSave').classList.add('hidden');
  busy(true, 'Checking your face…');

  // 1. Free, on-device check first, so non-faces never use up a cut.
  let lm;
  try {
    const landmarker = await getLandmarker();
    lm = landmarker.detect(state.photo).faceLandmarks?.[0];
  } catch (e) {
    console.error(e);
  }
  if (run !== state.run) return;
  if (!lm) {
    busy(false);
    message('No face found. Try a well-lit, front-facing photo with your whole head in frame.');
    $('resultActions').classList.remove('hidden');
    return;
  }
  const face = faceGeometry(lm, state.photo.width, state.photo.height);
  const hairRgb = sampleHairColor(state.photo, face);
  const colorHint = colorName(hairRgb);

  if (state.demo) return demoCut(run, face, hairRgb);

  // 2. Send to the AI stylist.
  let line = 0;
  busy(true, WAIT_LINES[0]);
  const ticker = setInterval(() => busy(true, WAIT_LINES[++line % WAIT_LINES.length]), 3500);
  const fail = (text) => {
    clearInterval(ticker);
    if (run !== state.run) return;
    busy(false);
    message(text);
    $('resultActions').classList.remove('hidden');
  };

  let id;
  try {
    const { ok, status, data } = await api('/api/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ image: photoForUpload(), colorHint, aspect: state.photo.width / state.photo.height }),
    });
    if (!ok) {
      if (data.error === 'paused') { clearInterval(ticker); await refreshQuota(); return; }
      if (data.error === 'person') return fail("You've had your free cuts. Share the app with a friend instead.");
      if (status === 413) return fail('That photo is too big. Try a smaller one.');
      return fail('The AI stylist is having a moment. Try again in a minute — this one did not count.');
    }
    id = data.id;
    if (state.quota) { state.quota.remaining = data.remaining; paintQuota(); }
  } catch {
    return fail('No connection to the salon. Check your internet and try again.');
  }

  // 3. Wait for the result (usually 15–40 s).
  const started = Date.now();
  while (Date.now() - started < 4 * 60 * 1000) {
    await sleep(2500);
    if (run !== state.run) { clearInterval(ticker); return; }
    let s;
    try {
      const r = await api(`/api/status?id=${encodeURIComponent(id)}`);
      if (r.status >= 500) continue; // transient — keep waiting
      s = r.data;
    } catch { continue; }
    if (s.status === 'completed') {
      try {
        const img = await loadImage(API + s.image);
        if (run !== state.run) return;
        clearInterval(ticker);
        reveal(img);
      } catch {
        fail('The cut is done but would not load. Try again.');
      }
      return;
    }
    if (s.status === 'nsfw') return fail('The AI refused this photo. Try a different one — this one did not count.');
    if (s.status === 'failed' || s.status === 'canceled' || s.error) {
      return fail('The AI stylist slipped. Try again — this one did not count.');
    }
  }
  fail('The salon is very busy right now. Try again in a few minutes.');
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
$('btnAgain').onclick = () => { state.run++; show('start'); refreshQuota(); };

const peek = (on) => { state.showOriginal = on; drawResult(); };
const pk = $('btnPeek');
pk.addEventListener('pointerdown', (e) => { e.preventDefault(); peek(true); });
for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) pk.addEventListener(ev, () => peek(false));

$('btnSave').onclick = () => {
  if (!state.result) return;
  state.showOriginal = false;
  drawResult();
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
refreshQuota();
