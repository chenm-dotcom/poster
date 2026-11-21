# Pony Ketamine — going live with real AI

The app runs on **Cloudflare Workers** (free plan is enough). One deploy serves
the web pages *and* the small server that holds your Higgsfield key and counts
the free cuts. After **400** AI haircuts the app shows "Salon closed" to everyone.

## 1. Higgsfield API key

1. Sign in at <https://open.higgsfield.ai> → API keys → create a key.
   You get a **Key ID** and a **Key Secret**.
2. Top up your balance (minimum $5). The model used here is Grok Image 2.0
   (edit) — roughly $0.07 per haircut, so 400 cuts ≈ $28 (top up at least $30).

## 2. Cloudflare account

Create a free account at <https://dash.cloudflare.com/sign-up>.

## 3. Deploy (on a computer with Node.js installed)

```bash
cd pony-ketamine
npx wrangler login                              # opens the browser once

npx wrangler secret put HIGGSFIELD_KEY_ID       # paste the Key ID
npx wrangler secret put HIGGSFIELD_KEY_SECRET   # paste the Key Secret
npx wrangler secret put ADMIN_TOKEN             # make up a long password (for you only)
npx wrangler secret put HASH_SALT               # any random text

npx wrangler deploy
```

It prints your live link, e.g. `https://pony-ketamine.<your-name>.workers.dev`.
Open it on your phone. That's the app.

## Settings (`wrangler.toml` → `[vars]`, then `npx wrangler deploy` again)

| Setting | Default | What it does |
|---|---|---|
| `MAX_USES` | `400` | App pauses after this many AI haircuts. Raise it to reopen. |
| `PER_PERSON_LIMIT` | `3` | Cuts per person (per network/IP). `0` = no limit. |
| `MODEL` | `grok` | `grok` = Grok Image 2.0 edit, `qwen` = Qwen Image 3 edit. Try the other if results disappoint. |
| `STYLE_REF_URL` | – | Optional public link to a photo of the perfect cut. The AI uses it only for the haircut shape. Use an AI-rendered model, not a real person's photo. |

Failed or refused AI attempts don't count. Photos where no face is found are
caught on the phone and never reach the AI.

## Checking usage / reopening

```bash
# how many cuts are used
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" https://pony-ketamine.<you>.workers.dev/api/admin/stats

# reset the counter to 0 (reopens the salon for another 400)
curl -X POST -H "Authorization: Bearer YOUR_ADMIN_TOKEN" https://pony-ketamine.<you>.workers.dev/api/admin/reset
```

## Privacy

The selfie goes to Higgsfield only to make the cut; the Worker doesn't store
photos. Only a scrambled (hashed) network ID is kept, to enforce the per-person limit.
