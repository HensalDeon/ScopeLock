# Engineering conventions

How code is organised and what every feature must do before it ships. `docs/PLAN.md` says **what** we build; this file says **how**. Lint rules and tests enforce most of it. The rest is reviewed by hand against the checklists at the end.

## 1. Layout

```
src/
  app/                    Routes only: pages, layouts, route handlers. Thin.
    (marketing)/          Public site (static)
    (auth)/               Sign in, sign up, reset
    (app)/                Signed-in app (protected by proxy.ts + requireWorkspace)
    (portal)/             Client portal: public, secret-link pages (/c/[token])
    api/                  Route handlers (auth, health; webhooks later)
  modules/<name>/         One folder per business capability
    index.ts              Public, client-safe API: types, schemas, UI, server-action refs
    server.ts             Public, server-only API: queries and helpers for pages/other modules
    domain/               Pure rules + Zod schemas. No framework, DB or auth. Unit tested.
    server/               repository.ts, queries.ts, actions.ts ("use server")
    ui/                   Components. "use client" only on the leaves that need it.
  modules/documents/      Client-facing document templates, style and default text. Other
                          modules hand it plain data (ProposalDocumentData) to render.
  modules/approvals/      Signed, insert-only evidence of client decisions.
  modules/portal/         The client's public pages (/c/[token]); no sign-in. Exposes
                          only server.ts (PortalPage) and a public server action.
  shared/
    auth/                 Better Auth config, session, membership, redirect, policy
    db/                   Mongo client, names, indexes, scopedCollection, transactions, ids
    email/                Layout, templates, sender
    lib/                  Pure helpers: money, hash, token, form-state, initials, env
    ui/                   shadcn primitives + brand + small shared components
    config/               Site and legal constants
  proxy.ts                Optimistic auth gate (Node runtime)
  test/                   Test setup only
```

**Boundaries (lint-enforced):**

- Import another module only through `@/modules/<name>` or `@/modules/<name>/server`, never its internals.
- `src/shared` never imports from `src/modules`.
- `domain/` imports nothing from Next, React, MongoDB, auth or the DB.
- Module code never touches raw collections. Use `scopedCollection()`.
- `server.ts` files start with `import "server-only"`. A client component importing one fails the build.

## 2. A new module, step by step (example: `clients`)

```
src/modules/clients/
  index.ts                export { ClientForm, ClientList, type Client, clientInputSchema }
  server.ts               export { listClients, getClient }
  domain/client.ts        type Client, CLIENT_FIELDS, clientInputSchema, pure rules
  domain/client.test.ts
  server/repository.ts    scopedCollection("clients", workspaceId); toClient(doc)
  server/repository.int.test.ts
  server/queries.ts       listClients(), getClient(id): call requireWorkspace() inside
  server/actions.ts       "use server"; createClient = workspaceAction(...)
  ui/client-form.tsx      "use client"; useActionState(createClient, IDLE)
  ui/client-list.tsx      server component with a real empty state
```

Then:

1. Add the collection name to `shared/db/names.ts` and its indexes to `shared/db/indexes.ts`. Every index on business data starts with `workspaceId`. Run `npm run db:indexes`.
2. If the module adds a route under `(app)/`, add it to the matcher in `src/proxy.ts`. `proxy.test.ts` fails until you do.

## 3. Data access

- **Always scoped.** `scopedCollection<T>(name, workspaceId)` sets `workspaceId` on every filter (it can't be overridden), stamps it on inserts, and maintains `createdAt`/`updatedAt`.
- **Public lookups** that can't be scoped by workspace, such as a portal opened by token hash, get one dedicated repository function with a comment explaining why. Review these carefully.
- **Exported queries never take `workspaceId` as a parameter.** They resolve it with `requireWorkspace()`, which is cached per request. Callers can't pass someone else's.
- **Ids:**
  - `_id` is an ObjectId in the database and `id: string` in domain types.
  - Map with a `toX(doc)` function in the repository.
  - Parse ids from URLs and forms with `parseObjectId()`. If it returns `null`, call `notFound()`.
  - `workspaceId` is stored as a string.
  - Embedded items (scope lines, milestones) get `randomUUID()` ids.
- **Multi-document writes** that must agree (approval + status + payment line) go in `withTransaction()`. Pass `{ session }` to every write. Don't send emails inside a transaction, because it can retry.
- **State changes are atomic:** `findOneAndUpdate({ _id, status: "sent" }, { $set: { status: "approved" } })`. If it returns `null`, someone else got there first.
- **Money** is integer minor units (`Minor`; `Paise` for rupee-only code), always. The currency lives on the record (a project's `currency`), and amounts are never summed across currencies. Use `allocate()` for splits, `parseAmount()` for input and `formatMoney(amount, currency)` for display.

## 4. Server actions

Use `workspaceAction()` from `@/modules/workspace/server` for every form that changes workspace data:

```ts
"use server";
export const createClient = workspaceAction(
  {
    fields: CLIENT_FIELDS,
    schema: clientInputSchema,
    roles: ["owner", "admin", "member"],
  },
  async (input, { workspace, user }) => {
    if (await emailTaken(workspace.workspaceId, input.email)) {
      throw new UserError("A client with this email already exists.");
    }
    const id = await insertClient(workspace.workspaceId, input);
    return { message: "Client added.", id };
  },
);
```

It handles these, in order:

1. Fresh session check (not the cookie cache).
2. Workspace membership and role.
3. Reading only the declared fields.
4. Zod validation, with field errors.
5. `UserError` messages shown to the person, and every other error logged with a generic message.

`redirect()` and `notFound()` work inside the handler.

**Never trust from the client:** `workspaceId`, `userId`, prices or totals, status, or anything you can look up yourself. A hidden form field is user input.

After a change that other parts of the page show, call `refresh()` from `next/cache`.

### Forms in the browser

- **Validate live with the server's own Zod schema**, using `useFormValidation(schema, values, { initial, serverState })`. The browser and server can't disagree.
- **"Reward early, punish late":** a field is checked when the person leaves it or submits. Once it's flagged, it re-checks on every keystroke, so the message goes away the moment the value is right.
- **Invalid submits never reach the server.** Use `markSubmitted()` and, if it fails, `focusFirstInvalid(form)`. Server-only errors still show until the field is edited (`edited(path)`).
- **Edit forms disable Save until `isDirty`.** It compares cleaned values, so "98765 43210" vs "+91 98765 43210" isn't a change. Show "No changes yet" or the saved message next to the button.
- **Keep inputs controlled and submit by hand** (`onSubmit` → `startTransition(() => action(data))`). React's post-action form reset otherwise clears controlled fields such as a `<select>`.
- **Repeated rows:** errors use dotted paths (`items.0.amount`), and "touched" uses the row's stable key.

## 5. Pages and rendering (Next.js 16, Cache Components)

- Pages are thin: call `requireWorkspace()` or a module query, then render module UI.
- Anything that reads the session, headers or cookies renders inside `<Suspense>` with a skeleton that has the same shape.
- No `"use cache"` on workspace data in Phase 2. If it's added later, key and tag it by `workspaceId` and call `updateTag` in actions. Never pass a raw portal token into a cached function, because it becomes a stored cache key.
- Lists have a real empty state: what will appear here and how to add the first item.
- Every inner page (detail, new, edit) starts with a `BackLink` to its parent ("← Projects", "← Back to project"). Phones and the installed app have no reliable browser Back button.
- Bad ids and missing records call `notFound()`. Unexpected failures fall through to `app/error.tsx`.
- **Visited pages stay alive.** With Cache Components, Next keeps up to 3 visited pages hidden (React `<Activity>`) and restores their state on return. Decide per piece of state:
  - Transient UI (dropdowns, popovers, confirm dialogs) resets when hidden, with a `useLayoutEffect` cleanup that closes it.
  - "Create" forms reset after a successful submit.
  - Drafts the user would want back can stay.
  - See `node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md`.
- **Crossing the auth boundary** (sign in, sign up, sign out, password-reset sign-in) uses `crossAuthBoundary()`, a full page load, so no client state survives from one account to the next.

## 6. Security checklists

**Every feature**

- [ ] All reads and writes go through `scopedCollection` or a reviewed public lookup.
- [ ] Mutations go through `workspaceAction` (or an equally strict hand-written action), with the right `roles`.
- [ ] Every input is validated with Zod, with lengths capped (names ≤ 120, notes ≤ 2,000, amounts are safe integers).
- [ ] Errors shown to users say what to do next and never include stack traces, ids or database messages.
- [ ] New env vars go in `shared/lib/env.ts` (Zod) and `.env.example`.
- [ ] New third-party origins go in the CSP in `next.config.ts`, in the narrowest directive that needs them.

**Client portal and secret links (Phase 3+)**

- [ ] Tokens come from `generateToken()` (256-bit). Store only `hashToken(token)`, with a unique index. If the link must be shown again, also store a copy sealed with `encryptText("portal-link-v1", …)` (key derived from the app secret, never in the database), so a database leak alone yields no working links.
- [ ] Check the token format (`/^[A-Za-z0-9_-]{43}$/`) before querying. Unknown, revoked and expired tokens all get the same `notFound()`. The portal streams, so that page is served with status 200 for every bad link. Don't add a format check in `proxy.ts`: malformed links would then get a 404 and unknown ones a 200, which tells them apart.
- [ ] Rate-limit portal requests by IP and by token. The IP comes from `CLIENT_IP_HEADER`.
- [ ] Approve and reject work out the project or change request from the token only, never from ids the client sends.
- [ ] `/c/*` keeps `no-referrer`, `noindex` and `no-store` (set in `next.config.ts`).
- [ ] Sending a portal link requires `user.emailVerified`, checked inside the server action, not only in the UI.

**Approval records (evidence)**

- [ ] Insert-only. The repository exposes `insert` and `find` only, and there is no update or delete code path.
- [ ] Snapshot built from the database, not from the request. Store `hashSnapshot(snapshot)`, `SNAPSHOT_HASH_VERSION`, IP, user agent and timestamp.
- [ ] Unique index on `{ subjectType, subjectId }` so a double-click can't approve twice.
- [ ] The status change and the approval insert happen in one transaction.
- [ ] Sign every record with `sign("evidence-v1", …)` over its canonical facts (including the snapshot hash), and re-check hash + signature when showing it. Database access alone then can't rewrite history. Before launch, also use an Atlas user that can only `find` and `insert` on approvals.
- [ ] Guard the status change on everything the client saw: `status`, the link's hash and the sent version (`sent.sentAt`). A withdrawn, re-sent or re-linked proposal can't be decided with an old page.

**File uploads (logo, payment proof)**

- [ ] The R2 bucket is private. Object key is `ws/{workspaceId}/{kind}/{generateToken()}`, never the uploaded filename.
- [ ] Only `image/png`, `image/jpeg` and `image/webp`. Check the magic bytes, not just the extension or MIME type. Size limit of about 5 MB.
- [ ] Serve files through short-lived signed URLs. Proofs download with `Content-Disposition: attachment`.

**Webhooks (Razorpay, Phase 8)**

- [ ] Verify the HMAC over the raw body (`await req.text()`) with `timingSafeEqual`.
- [ ] Idempotent: store the event id with a unique index and ignore repeats.

## 7. Testing

| What                                     | Where                  | Run                |
| ---------------------------------------- | ---------------------- | ------------------ |
| Pure rules (money, scope maths, schemas) | `*.test.ts` next to it | `npm test`         |
| Repositories, scoping, transactions      | `*.int.test.ts`        | `npm run test:int` |
| Whole flows (sign-up, approve, pay)      | Playwright (planned)   | n/a                |

Integration tests run against an in-memory MongoDB replica set, with one database per test file. The first run downloads `mongod`.

## 8. Definition of done

- [ ] `npm run check` passes: typecheck, lint, format and unit tests.
- [ ] `npm run test:int` and `npm run build` pass. CI runs all of these on every push.
- [ ] Checked at 390 px wide with no horizontal scroll. Pending and empty states exist.
- [ ] The security checklist above has been gone through for the feature's type.
- [ ] `docs/PLAN.md` checklist and progress log are updated.
