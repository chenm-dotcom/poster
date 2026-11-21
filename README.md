# Pony Ketamine

Take a selfie or upload a photo and an AI stylist gives you **long hair with
super-short, blunt micro bangs** in your own hair colour. Berlin techno look,
goth ta-da, soft hard-techno beat.

- **Preview:** <https://chenm-dotcom.github.io/poster/> (demo mode: drawn haircut, no AI)
- **Go live with AI (Higgsfield) + 400-use cap:** see [SETUP.md](SETUP.md)

| Path | What |
|---|---|
| `index.html`, `style.css`, `app.js` | the app |
| `audio.js` | ta-da + techno, synthesized live (Web Audio) |
| `demo.js` | drawn stand-in haircut used when the AI server isn't connected |
| `worker/` + `wrangler.toml` | Cloudflare Worker: keeps the API key secret, counts uses, pauses at 400 |
