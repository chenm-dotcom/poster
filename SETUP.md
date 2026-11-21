# Pony Ketamine — switching on the real AI

Right now <https://chenm-dotcom.github.io/poster/> runs in **demo mode** (the cut
is drawn on the phone). To get real AI haircuts you connect two accounts. All
of it works in a web browser — no computer terminal needed.

**Cost:** about $0.07 per haircut on Higgsfield. The app stops itself after
**400** cuts (≈ $28), so top up about $30. Cloudflare is free.

---

## Step 1 — Higgsfield key (5 min)

1. Go to <https://open.higgsfield.ai> and sign in.
2. Open **API keys** → **Create key**. Copy the **Key ID** and the **Key Secret**
   somewhere safe (the secret is shown only once).
3. Add credit (Billing → top up ~$30).

## Step 2 — Put the app on Cloudflare (10 min)

1. Create a free account at <https://dash.cloudflare.com/sign-up>.
2. In the dashboard: **Workers & Pages** → **Create** → **Import a repository**
   (it may say "Connect to Git").
3. Connect GitHub and choose the repository **chenm-dotcom/poster**, branch **main**.
4. Leave the build command empty. Deploy command: `npx wrangler deploy`
   (usually filled in already). Click **Deploy**.
5. When it finishes you get a link like `https://pony-ketamine.YOURNAME.workers.dev`.

## Step 3 — Give it the keys (3 min)

In Cloudflare: **Workers & Pages** → **pony-ketamine** → **Settings** →
**Variables and Secrets** → **Add**. Add these four, each as type **Secret**:

| Name | Value |
|---|---|
| `HIGGSFIELD_KEY_ID` | the Key ID from step 1 |
| `HIGGSFIELD_KEY_SECRET` | the Key Secret from step 1 |
| `ADMIN_TOKEN` | a long password you make up (for checking usage) |
| `HASH_SALT` | any random text |

Save / deploy. Open your `workers.dev` link on your phone — that's the
pure-AI app, with the free-cuts counter.

## Step 4 — Make the GitHub link use the AI too (optional)

Send your `workers.dev` link to Claude, or edit `index.html` yourself: put the
link in the line `<meta name="pk-api" content="">`, e.g.
`content="https://pony-ketamine.YOURNAME.workers.dev"`. From then on
<https://chenm-dotcom.github.io/poster/> uses the AI only — no more drawn demo.

---

## Settings

Change in `wrangler.toml` (Cloudflare redeploys by itself when `main` changes):

| Setting | Default | What it does |
|---|---|---|
| `MAX_USES` | `400` | App shows "Salon geschlossen" after this many AI cuts. |
| `PER_PERSON_LIMIT` | `3` | Cuts per person (per network). `0` = no limit. |
| `MODEL` | `grok` | `grok` = Grok Image 2.0 edit, `qwen` = Qwen Image 3 edit. Try the other if results disappoint. |
| `STYLE_REF_URL` | – | Optional link to a photo of the perfect cut (use an AI-made model). The AI copies only the haircut shape. |

Failed or refused AI attempts don't count. Photos with no face are caught on
the phone and never reach the AI.

## Checking usage / reopening

Open in a browser tool that can send headers, or run in a terminal:

```bash
# how many cuts are used
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" https://pony-ketamine.YOURNAME.workers.dev/api/admin/stats

# reset to 0 (reopens the salon for another 400)
curl -X POST -H "Authorization: Bearer YOUR_ADMIN_TOKEN" https://pony-ketamine.YOURNAME.workers.dev/api/admin/reset
```

## Privacy

The selfie goes to Higgsfield only to make the cut; the server doesn't store
photos. Only a scrambled network ID is kept, to enforce the per-person limit.
