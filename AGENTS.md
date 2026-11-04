<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## ScopeLock project rules

Read `docs/PLAN.md` first — it is the source of truth for product rules, data model and the phased roadmap. Work one phase at a time and tick items off in the plan's checklist + progress log.

- **Architecture:** feature-first modular monolith. Business code lives in `src/modules/<module>/{domain,server,ui}` with a public `index.ts`; modules import each other only through that `index.ts`. `src/app/` routes stay thin. Cross-cutting code lives in `src/shared/` (`db/`, `lib/`, `ui/` = shadcn components, `config/`).
- **Domain logic** = pure, framework-free functions in `domain/`, covered by Vitest (`*.test.ts` next to the file).
- **Money:** always integer paise (`Paise` type, `src/shared/lib/money.ts`). Never floats. Use `allocate()` for splits.
- **Multi-tenancy:** every business document has `workspaceId`; every query filters by it.
- **Evidence:** approval records are insert-only, with snapshot + `hashSnapshot()`.
- **Secret links:** store only `hashToken(token)`, never the raw token.
- **Next.js here has Cache Components on:** data is dynamic by default; session/cookie reads must sit inside `<Suspense>`; use `"use cache"` deliberately. Check `node_modules/next/dist/docs/` before using an API.
- **Portability:** must keep running on a plain Node server (`output: "standalone"`, Hostinger later). No `@vercel/*` packages, no Edge runtime.
- **Brand:** "Focus Lock" mark. All logo/icon/loader geometry lives in `src/shared/ui/brand/geometry.ts`; use `<Logo />`, `<LogoMark />`, `<BrandLoader />` / `<PageLoader />`, never hand-drawn copies. Brand colours: `brand`, `brand-bright`, `brand-ink` Tailwind tokens.
- **Env vars:** add to `src/shared/lib/env.ts` (Zod) and `.env.example`.
- Before finishing a task run `npm run check` (typecheck + lint + tests) and `npm run build`.
