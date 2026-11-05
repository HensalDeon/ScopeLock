# ScopeLock

**Stop doing extra work for free.** Lock the original scope with your client, turn every extra request into an approved change order, and get paid on your own terms.

- Product rules, data model and roadmap: [`docs/PLAN.md`](docs/PLAN.md)
- How the code is organised and the security checklists: [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md)

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui · MongoDB Atlas · Better Auth · Zod · Vitest · PWA

## Getting started

Requires Node 22 (`nvm use` reads `.nvmrc`).

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable             | Where to get it                                                      |
| -------------------- | -------------------------------------------------------------------- |
| `MONGODB_URI`        | Atlas → Database → Connect → Drivers                                 |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` (at least 32 characters)                   |
| `SMTP_*`             | Optional locally: without it, emails and codes print to the terminal |

Then:

```bash
npm run db:indexes   # once, and after adding indexes
npm run dev          # http://localhost:3000
```

To check the database connection, open http://localhost:3000/api/health. You should see `"db": { "status": "up" }`.

## Scripts

| Command              | What it does                                                   |
| -------------------- | -------------------------------------------------------------- |
| `npm run dev`        | Start the dev server                                           |
| `npm run build`      | Production build (standalone output)                           |
| `npm run check`      | Typecheck + lint + format check + unit tests (run before a PR) |
| `npm test`           | Unit tests                                                     |
| `npm run test:int`   | Integration tests against an in-memory MongoDB                 |
| `npm run format`     | Format with Prettier                                           |
| `npm run db:indexes` | Create or update MongoDB indexes                               |

CI (`.github/workflows/ci.yml`) runs the check, integration tests, a production dependency audit and the build on every push to `dev` and `main`.

## Deploying

The build needs env vars to be present. Placeholder values are fine for everything except `APP_URL`, which is baked into the sitemap, robots and share links, so set it to the real public URL.

At runtime, all variables come from the host. In production, `APP_URL` must be `https://` and SMTP must be configured, or verification and reset codes can't be delivered.

- **Now: Vercel (Hobby).**
  - Production branch: `main`.
  - Env vars: `APP_URL`, `MONGODB_URI`, `MONGODB_DB`, `BETTER_AUTH_SECRET` (a new one, not your local one), and the `SMTP_*` values.
- **Later: Hostinger or any Node server**, behind nginx with `proxy_set_header X-Real-IP $remote_addr;` and `CLIENT_IP_HEADER=x-real-ip`:
  ```bash
  npm ci && npm run build
  cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
  PORT=3000 node .next/standalone/server.js
  ```
