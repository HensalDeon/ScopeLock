<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## ScopeLock project rules

Read `docs/PLAN.md` first — it is the source of truth for product rules, data model and the phased roadmap. Work one phase at a time and tick items off in the plan's checklist + progress log. Read `docs/CONVENTIONS.md` before building a feature: module layout, data access, server actions, and the security checklists every feature must pass.

- **Architecture:** feature-first modular monolith. Business code lives in `src/modules/<module>/{domain,server,ui}` with two public entries: `index.ts` (client-safe) and `server.ts` (server-only). Modules import each other only through those (lint-enforced). `src/app/` routes stay thin. Cross-cutting code lives in `src/shared/` (`auth/`, `db/`, `email/`, `lib/`, `ui/` = shadcn components, `config/`).
- **Data access:** module code uses `scopedCollection()` (never raw collections), so every query is pinned to a workspace. Mutations use `workspaceAction()` (fresh session + membership + role + Zod). Multi-document writes use `withTransaction()`.
- **Domain logic** = pure, framework-free functions in `domain/`, covered by Vitest (`*.test.ts` next to the file).
- **Money:** always integer minor units (`Minor` type, `src/shared/lib/money.ts`; `Paise` for rupee-only code). Never floats. Each project has one currency (`src/shared/lib/currency.ts`); format with `formatMoney(amount, currency)`, never sum across currencies. Use `allocate()` for splits.
- **Multi-tenancy:** every business document has `workspaceId`; every query filters by it.
- **Evidence:** approval records are insert-only, with snapshot + `hashSnapshot()`.
- **Secret links:** store only `hashToken(token)`, never the raw token.
- **Next.js here has Cache Components on:** data is dynamic by default; session/cookie reads must sit inside `<Suspense>`; use `"use cache"` deliberately. Check `node_modules/next/dist/docs/` before using an API.
- **Portability:** must keep running on a plain Node server (`output: "standalone"`, Hostinger later). No `@vercel/*` packages, no Edge runtime.
- **Brand:** "Focus Lock" mark. All logo/icon/loader geometry lives in `src/shared/ui/brand/geometry.ts`; use `<Logo />`, `<LogoMark />`, `<BrandLoader />` / `<PageLoader />`, never hand-drawn copies. Brand colours: `brand`, `brand-bright`, `brand-ink` Tailwind tokens.
- **Env vars:** add to `src/shared/lib/env.ts` (Zod) and `.env.example`.
- Before finishing a task run `npm run check` (typecheck + lint + format + unit tests), `npm run test:int` and `npm run build`. CI runs the same.

## Voice and UI (keep ScopeLock from looking generated)

- **Copy:** plain and specific, written like a person who knows freelancing in India. Sentence case. No exclamation marks, no emoji, no "Welcome back!", "Unlock", "Supercharge", "Seamless", "Effortless", "Elevate". Buttons say exactly what happens ("Create workspace", "Send reset link"). Errors say what went wrong and what to do next.
- **Use real product content as the design:** rupee amounts in `formatINR`, CR numbers, client names, dates like "18 Nov, 3:42 pm". Never lorem ipsum, never placeholder slogans.
- **No generic AI looks:** no gradient heroes, no glowing blobs, no `rounded-2xl` + shadow on every block, no centered-everything marketing layouts inside the app, no icon-in-a-circle feature grids.
- **Visual system:** ink navy (`primary`) for actions, emerald (`brand`) only for "approved / done / money recovered", amber (`warning`) for "waiting". Neutrals are the slate-tinted tokens in `globals.css`. Numbers use `tabular-nums`. Small uppercase labels use `font-mono` with letter-spacing.
- **States:** every async UI has a pending label ("Saving…"), every list has a real empty state that says what will appear and how to add the first item.
- Check new screens at 390px wide: no horizontal scroll.
