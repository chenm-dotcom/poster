// Demo-mode haircut: drawn on the user's own photo when the AI server isn't
// connected (e.g. the GitHub Pages preview). Not as good as the AI — just a
// stand-in so the whole app can be tried.

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

export function drawCut(photo, f, color, seed = 1) {
  const result = layer(photo.width, photo.height);
  const octx = result.getContext('2d');
  octx.drawImage(photo, 0, 0);
  const { W, H } = f;
  const rand = mulberry32(seed);
  const opt = { bangs: 0.22, length: 1.2, volume: 1 };
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
  return result;
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
