# AI Social Media Caption Generator

A Cloudflare Worker that generates social media captions using Workers AI (Llama 3.2 3B).

## Features

- Six platforms: Instagram, X, LinkedIn, Facebook, TikTok, generic
- Five tones: casual, professional, humorous, inspirational, educational
- Generates 3 caption variants per request
- Runs on Cloudflare Workers AI — no API keys
- Built-in rate limiting (30 requests/min per IP)
- Text is not stored or logged
- Multi-language interface (EN + ZH)

## Setup

```bash
npm install
npx wrangler login
npx wrangler deploy
```

## Routes

Add to `tool-proxy`:
- `toolara.dev/ai-social-caption-generator/*`
- `www.toolara.dev/ai-social-caption-generator/*`

## License

MIT
