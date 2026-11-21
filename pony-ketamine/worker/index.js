// Pony Ketamine API — keeps the Higgsfield key secret, enforces the free-use
// cap (pauses the app at MAX_USES), and proxies the AI result back.
//
//   GET  /api/quota                 → { used, limit, remaining, paused }
//   POST /api/generate              → { id, remaining }       body: { image: dataURL, colorHint?, aspect? }
//   GET  /api/status?id=…           → { status, image? }
//   GET  /api/image?id=…            → the finished PNG (same-origin, so it can be saved)
//   GET  /api/admin/stats           → admin only (Authorization: Bearer ADMIN_TOKEN)
//   POST /api/admin/reset           → admin only: clears the counter
//
// Static files in ../public are served by Cloudflare's asset handler.

import { DurableObject } from 'cloudflare:workers';

const PROMPT = (colorHint) => [
  'Edit only the hairstyle of the person in this photo.',
  "Give them a \"Pony Ketamine\" haircut: long, straight, sleek hair falling well past the shoulders,",
  'with extremely short, blunt micro bangs (baby bangs) cut straight across high on the forehead —',
  'the fringe ends roughly one third of the way down from the hairline, far above the eyebrows, with the forehead clearly visible below it.',
  'The fringe edge is crisp and blunt with a slightly choppy, piecey texture. Edgy Berlin hipster look.',
  `Keep exactly the same hair colour as the person's current hair${colorHint ? ` (it looks ${colorHint})` : ''}, including natural roots and highlights.`,
  'Do not change anything else: keep the face, identity, facial features, skin, expression, eyes, makeup, glasses, ears, jewellery,',
  'clothing, body, pose, background, lighting, colours and camera framing exactly as they are.',
  'Photorealistic result with a natural hairline, realistic individual strands, natural shine and correct shadows on the forehead.',
].join(' ');

const NEGATIVE = 'long bangs, bangs covering eyebrows, side-swept bangs, curtain bangs, different face, changed identity, ' +
  'different clothes, different background, cartoon, illustration, wig look, plastic hair, blurry, distorted face';

const QWEN_RATIOS = { '1:1': 1, '2:3': 2 / 3, '3:2': 3 / 2, '3:4': 3 / 4, '4:3': 4 / 3, '7:9': 7 / 9, '9:7': 9 / 7, '9:16': 9 / 16, '16:9': 16 / 9 };

/* ─────────────────────────── usage counter ─────────────────────────── */

// One Durable Object instance holds the whole count, so the cap is exact even
// when many people press the button at the same moment.
export class Quota extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS uses (
      slot TEXT PRIMARY KEY, who TEXT, request_id TEXT, status TEXT, created INTEGER)`);
  }

  counts(who) {
    const total = this.sql.exec("SELECT COUNT(*) AS n FROM uses WHERE status != 'refunded'").one().n;
    const mine = who
      ? this.sql.exec("SELECT COUNT(*) AS n FROM uses WHERE status != 'refunded' AND who = ?", who).one().n
      : 0;
    return { total, mine };
  }

  info(limit) {
    const { total } = this.counts();
    return { used: total, limit, remaining: Math.max(0, limit - total), paused: total >= limit };
  }

  reserve(who, limit, perPerson) {
    const { total, mine } = this.counts(who);
    if (total >= limit) return { ok: false, reason: 'paused' };
    if (perPerson > 0 && mine >= perPerson) return { ok: false, reason: 'person' };
    const slot = crypto.randomUUID();
    this.sql.exec('INSERT INTO uses (slot, who, status, created) VALUES (?, ?, ?, ?)', slot, who, 'reserved', Date.now());
    return { ok: true, slot, remaining: limit - total - 1 };
  }

  attach(slot, requestId) {
    this.sql.exec("UPDATE uses SET request_id = ?, status = 'running' WHERE slot = ?", requestId, slot);
  }

  owns(requestId) {
    return this.sql.exec('SELECT COUNT(*) AS n FROM uses WHERE request_id = ?', requestId).one().n > 0;
  }

  finish(requestId, ok) {
    // Failed / refused generations give the slot back.
    this.sql.exec(
      "UPDATE uses SET status = ? WHERE request_id = ? AND status = 'running'",
      ok ? 'done' : 'refunded', requestId);
  }

  refund(slot) {
    this.sql.exec("UPDATE uses SET status = 'refunded' WHERE slot = ?", slot);
  }

  stats(limit) {
    const rows = this.sql.exec('SELECT status, COUNT(*) AS n FROM uses GROUP BY status').toArray();
    return { ...this.info(limit), byStatus: Object.fromEntries(rows.map((r) => [r.status, r.n])) };
  }

  reset() {
    this.sql.exec('DELETE FROM uses');
  }
}

/* ─────────────────────────── helpers ─────────────────────────── */

const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...extra },
  });

function cors(env, request) {
  const origin = request.headers.get('origin');
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!origin || !allowed.includes(origin)) return {};
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    vary: 'origin',
  };
}

async function personId(request, env) {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const data = new TextEncoder().encode(`${env.HASH_SALT || 'pony'}:${ip}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hf(env, path, init = {}) {
  const base = env.HIGGSFIELD_BASE || 'https://api.higgsfield.ai';
  return fetch(base + path, {
    ...init,
    headers: {
      authorization: `Key ${env.HIGGSFIELD_KEY_ID}:${env.HIGGSFIELD_KEY_SECRET}`,
      'content-type': 'application/json',
      ...(init.headers || {}),
    },
  });
}

async function hfJson(res, what) {
  const text = await res.text();
  if (!res.ok) throw new Error(`${what} failed (${res.status}): ${text.slice(0, 300)}`);
  try { return JSON.parse(text); } catch { throw new Error(`${what}: bad JSON`); }
}

function decodeDataUrl(dataUrl) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(dataUrl || '');
  if (!m) return null;
  const bin = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { type: m[1], bytes };
}

function nearestQwenRatio(aspect) {
  let best = '1:1', d = Infinity;
  for (const [k, v] of Object.entries(QWEN_RATIOS)) {
    const dd = Math.abs(Math.log(v / aspect));
    if (dd < d) { d = dd; best = k; }
  }
  return best;
}

/* ─────────────────────────── handlers ─────────────────────────── */

async function generate(request, env, quota, limit) {
  const body = await request.json().catch(() => null);
  const img = decodeDataUrl(body?.image);
  if (!img) return json({ error: 'bad_image' }, 400);
  if (img.bytes.length > 6 * 1024 * 1024) return json({ error: 'too_big' }, 413);

  const colorHint = typeof body.colorHint === 'string' ? body.colorHint.slice(0, 40).replace(/[^a-z \-]/gi, '') : '';
  const aspect = Number(body.aspect) > 0 ? Number(body.aspect) : 1;

  const who = await personId(request, env);
  const perPerson = Number(env.PER_PERSON_LIMIT ?? 3);
  const r = await quota.reserve(who, limit, perPerson);
  if (!r.ok) return json({ error: r.reason }, r.reason === 'paused' ? 503 : 429);

  try {
    // 1. upload the selfie to Higgsfield storage
    const up = await hfJson(await hf(env, '/files/generate-upload-url', {
      method: 'POST',
      body: JSON.stringify({ content_type: img.type }),
    }), 'upload url');
    const put = await fetch(up.upload_url, { method: 'PUT', headers: up.upload_headers || { 'content-type': img.type }, body: img.bytes });
    if (!put.ok) throw new Error(`upload failed (${put.status})`);

    // 2. ask the model for the haircut
    const refs = [up.public_url];
    let prompt = PROMPT(colorHint);
    if (env.STYLE_REF_URL) {
      refs.push(env.STYLE_REF_URL);
      prompt += ' Image 2 is only a reference for the haircut shape (fringe length and cut); do not copy that person\'s face, hair colour, clothes or background.';
    }
    const model = (env.MODEL || 'grok').toLowerCase();
    let path, payload;
    if (model === 'qwen') {
      path = '/alibaba/qwen-image-3/edit';
      payload = {
        prompt, image_urls: refs, negative_prompt: NEGATIVE,
        resolution: '2k', aspect_ratio: nearestQwenRatio(aspect),
        prompt_extend: false, enable_thinking: false,
      };
    } else {
      path = '/xai/grok-imagine-image-2.0';
      payload = { prompt, image_urls: refs, resolution: '2k', aspect_ratio: 'auto', quality: 'medium' };
    }
    const job = await hfJson(await hf(env, path, {
      method: 'POST',
      headers: { 'idempotency-key': r.slot },
      body: JSON.stringify(payload),
    }), 'generate');
    if (!job.request_id) throw new Error('no request_id');
    await quota.attach(r.slot, job.request_id);
    return json({ id: job.request_id, remaining: r.remaining });
  } catch (e) {
    console.error(e);
    await quota.refund(r.slot);
    return json({ error: 'ai_error' }, 502);
  }
}

async function status(url, env, quota) {
  const id = url.searchParams.get('id') || '';
  if (!/^[\w-]{1,128}$/.test(id) || !(await quota.owns(id))) return json({ error: 'unknown' }, 404);
  const s = await hfJson(await hf(env, `/requests/${id}/status`), 'status');
  if (s.status === 'completed') {
    await quota.finish(id, true);
    return json({ status: 'completed', image: `/api/image?id=${encodeURIComponent(id)}` });
  }
  if (['failed', 'nsfw', 'canceled'].includes(s.status)) {
    await quota.finish(id, false);
    return json({ status: s.status });
  }
  return json({ status: s.status || 'queued' });
}

async function image(url, env, quota) {
  const id = url.searchParams.get('id') || '';
  if (!/^[\w-]{1,128}$/.test(id) || !(await quota.owns(id))) return new Response('not found', { status: 404 });
  const s = await hfJson(await hf(env, `/requests/${id}/status`), 'status');
  const src = s.images?.[0]?.url;
  if (!src) return new Response('not ready', { status: 409 });
  const r = await fetch(src);
  if (!r.ok) return new Response('gone', { status: 410 });
  return new Response(r.body, {
    headers: { 'content-type': r.headers.get('content-type') || 'image/png', 'cache-control': 'private, max-age=3600' },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);

    const c = cors(env, request);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: c });

    const limit = Number(env.MAX_USES ?? 50);
    const quota = env.QUOTA.get(env.QUOTA.idFromName('global'));
    const withCors = (res) => { for (const [k, v] of Object.entries(c)) res.headers.set(k, v); return res; };

    try {
      if (url.pathname === '/api/quota' && request.method === 'GET') return withCors(json(await quota.info(limit)));
      if (url.pathname === '/api/generate' && request.method === 'POST') return withCors(await generate(request, env, quota, limit));
      if (url.pathname === '/api/status' && request.method === 'GET') return withCors(await status(url, env, quota));
      if (url.pathname === '/api/image' && request.method === 'GET') return withCors(await image(url, env, quota));

      if (url.pathname.startsWith('/api/admin/')) {
        const ok = env.ADMIN_TOKEN && request.headers.get('authorization') === `Bearer ${env.ADMIN_TOKEN}`;
        if (!ok) return json({ error: 'forbidden' }, 403);
        if (url.pathname === '/api/admin/stats') return json(await quota.stats(limit));
        if (url.pathname === '/api/admin/reset' && request.method === 'POST') { await quota.reset(); return json({ ok: true }); }
      }
      return withCors(json({ error: 'not_found' }, 404));
    } catch (e) {
      console.error(e);
      return withCors(json({ error: 'server_error' }, 500));
    }
  },
};
