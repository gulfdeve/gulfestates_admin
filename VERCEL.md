# Vercel — gulfestates-admin (admin.gulfestates.ae)

Project: **gulf-sea/gulfestates-admin** (linked via `vercel link`).

## Verified production environment (Oct 2026)

| Variable | Production value | Status |
|----------|------------------|--------|
| `NEXT_PUBLIC_API_URL` | *(empty)* | Correct — browser calls same-origin `/api/*` |
| `BACKEND_API_URL` | `https://backend.gulfestates.ae` | Correct — Next.js rewrites proxy |

Pull locally:

```bash
npx vercel link --project gulfestates-admin
npx vercel env pull .env.vercel.production --environment=production
```

## API connectivity checks

```bash
curl -s https://backend.gulfestates.ae/health
curl -s "https://admin.gulfestates.ae/api/offplans?page=1&limit=1"
```

Both should return JSON with `success: true` when the backend DB is connected.

## After changing env vars

Redeploy **Production** in Vercel (env changes require a new build for `NEXT_PUBLIC_*`).

## Do not set on Production

- `NEXT_PUBLIC_API_URL=http://localhost:5050` — breaks all browser API calls
- Omitting `BACKEND_API_URL` is OK (defaults to `https://backend.gulfestates.ae` in `next.config.mjs`)
