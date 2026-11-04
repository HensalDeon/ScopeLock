# ScopeLock

**Stop doing extra work for free.** Lock the original scope with your client, turn every extra request into an approved change order, and get paid on your own terms.

Roadmap, product rules and data model: [`docs/PLAN.md`](docs/PLAN.md).

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS v4 · shadcn/ui · MongoDB Atlas · Zod · Vitest · PWA

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in MONGODB_URI
npm run dev                  # http://localhost:3000
```

Check it's wired up: open http://localhost:3000/api/health. You should see `"db": { "status": "up" }`.

## Scripts

| Command          | What it does                         |
| ---------------- | ------------------------------------ |
| `npm run dev`    | Start the dev server                 |
| `npm run build`  | Production build (standalone output) |
| `npm run check`  | Typecheck + lint + unit tests        |
| `npm test`       | Unit tests (Vitest)                  |
| `npm run format` | Format with Prettier                 |

## Deploying

- **Now:** Vercel (Hobby). Import the repo and set `APP_URL`, `MONGODB_URI` and `MONGODB_DB`.
- **Later (Hostinger / any Node server):**
  ```bash
  npm ci && npm run build
  cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
  PORT=3000 node .next/standalone/server.js
  ```
