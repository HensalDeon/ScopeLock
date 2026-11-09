# ScopeLock — Build Plan

> Turn scope creep into paid, approved change requests.
> Lock the original deal, log every extra request, get the client to approve it, and get paid on your own terms.

**First target users:** Indian freelance developers and small dev shops (2–5 people). Agencies come later.

---

## 1. Product rules (what we decided)

1. **The baseline is approved by the client.** Every project starts with a list of deliverables that the client approves through a link. Everything after that is compared against it.
2. **Approving and paying are separate steps.** The client approves a change request right away. Payment follows the freelancer's terms.
3. **Billing options for each change request:** pay now · add to next milestone · add to final payment · split across the remaining milestones.
4. **Billing models for the MVP:** full upfront · milestones (e.g. 30/30/40). Retainers come after the MVP.
5. **Payment methods are flexible.** UPI ID (with a QR code that has the amount filled in) · uploaded QR image · bank transfer details · external payment link · cash/other. Connected Razorpay with automatic confirmation comes after the MVP.
6. **Payments are confirmed by hand.** The client can say "I've paid" (with UTR and screenshot). **Only the freelancer** can mark a payment as received. The freelancer can also mark it received without any input from the client.
7. **ScopeLock never holds client money.** Money goes straight to the freelancer, so we don't act as a payment aggregator and avoid RBI compliance.
8. **The evidence can't be changed.** Every approval saves a frozen snapshot, a content hash, the timestamp, IP address, user agent, and the approver's name and email.
9. **Clients don't log in.** Clients reach their pages through secret links. Email OTP verification for approvers comes after the MVP.
10. **Client-facing documents carry the freelancer's brand.**
    - The proposal (quotation), change orders and invoices share one document style, set in Settings → Documents: template, accent colour, cover image and logo.
    - The client approves exactly what they see, so the approval snapshot includes the full proposal content.
11. **Each project has one currency.**
    - Supported: INR, USD, EUR, GBP, AED, CAD, AUD and SGD, all two-decimal, so amounts stay integer minor units.
    - The workspace has a default (INR), and each client can have their own.
    - A project picks up its client's currency and is locked once sent. Its CRs, payments and invoices use the same currency.
    - Totals are never added across currencies.
12. **Invoices follow Indian norms.**
    - Every invoice gets a sequential number that never repeats.
    - GST lines appear only when the freelancer has added a GSTIN.
    - The final invoice shows the original scope, approved changes, payments and balance.
    - A CA reviews the format once before launch.

---

## 2. Tech stack

| Layer         | Choice                                                             | Notes                                                                                                                                             |
| ------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework     | Next.js (App Router, latest stable) + TypeScript (strict)          | Server Actions for mutations, Route Handlers for webhooks and PDFs                                                                                |
| UI            | Tailwind CSS + shadcn/ui                                           | Mobile-first, because clients open links on their phones from WhatsApp                                                                            |
| Database      | **MongoDB Atlas**, official `mongodb` driver                       | Zod schemas are the single source of truth for types. Atlas supports transactions.                                                                |
| Auth          | Better Auth (MongoDB adapter, organization plugin)                 | Email/password + Google. Each user gets a personal "workspace", so teams work later.                                                              |
| Validation    | Zod                                                                | Forms, server actions, env vars                                                                                                                   |
| Email         | Nodemailer over SMTP (Resend / Brevo SMTP)                         | Plain React Email templates                                                                                                                       |
| File storage  | Cloudflare R2 (S3 API)                                             | Logos, QR images, payment proofs, PDFs                                                                                                            |
| PDF           | `@react-pdf/renderer`                                              | Works on serverless (no Puppeteer)                                                                                                                |
| QR            | `qrcode`                                                           | UPI `upi://pay?...` QR codes with the amount filled in                                                                                            |
| Subscriptions | Razorpay Subscriptions                                             | Only for ScopeLock's own revenue (Phase 8)                                                                                                        |
| Hosting       | Vercel (Hobby) → **Hostinger** later                               | Stay portable: no `@vercel/*` packages, no Edge-only code, `output: "standalone"` so it runs on any Node server (Hostinger VPS / Node.js hosting) |
| PWA           | Next.js `app/manifest.ts` + generated icons + small service worker | Freelancers can install ScopeLock on their phone or desktop like an app                                                                           |
| Monitoring    | Sentry (free tier)                                                 | Phase 8                                                                                                                                           |

**Money rule:** all amounts are stored as **integers in paise** (`₹80,000 → 8000000`). Never use floats.

---

## 3. Architecture

**Modular monolith, feature-first, with light DDD:**

- Each business area is a **module** with its own domain logic, data access and UI.
- **Domain logic** (rules and calculations) lives in plain, framework-free functions, which makes it easy to test.
- `app/` routes stay thin. They call module actions and render module components.
- Modules only import each other through their `index.ts` (public API).
- No extra layers (no DI containers, no abstract repositories). Add structure only when the code needs it.

```
src/
  app/
    (marketing)/            landing, pricing, legal
    (auth)/                 sign-in, sign-up
    (app)/                  logged-in freelancer area
      dashboard/
      projects/[projectId]/
      clients/
      settings/
    c/[token]/              public client portal (no login)
    api/                    auth, pdf, webhooks
  modules/
    workspace/              business profile, payment methods
    clients/
    projects/               project, baseline scope, milestones
    change-requests/
    approvals/              share links, decisions, evidence snapshots
    payments/               dues, client-reported payments, confirmations
    documents/              PDF generation
    notifications/          emails
    billing/                ScopeLock subscriptions & plan limits (Phase 8)
      └─ each module:
         domain/            types, Zod schemas, pure rules
         server/            repository (Mongo queries), server actions
         ui/                React components
         index.ts           public API
  shared/
    db/                     Mongo client, collections, transactions
    auth/                   Better Auth config, session helpers
    lib/                    money, dates, hashing, tokens, env
    storage/                R2 client
    ui/                     shadcn components
```

---

## 4. Data model (MongoDB collections)

> Every document has `_id`, `createdAt`, `updatedAt`. Every business document has `workspaceId`, and **every query is scoped by it**.

**Better Auth (managed by the library):** `user`, `session`, `account`, `verification`, `organization` (= workspace), `member`, `invitation`.

**`workspaceProfiles`**: business name, logo, address, GSTIN (optional), default currency (`INR`), change-order terms text, `paymentMethods[]`:

```ts
{ id, type: 'upi' | 'qr_image' | 'bank' | 'link' | 'other',
  label, upiId?, payeeName?, qrImageKey?, bank?: { accountName, accountNumber, ifsc, bankName },
  url?, instructions?, isDefault }
```

**`documentSettings`** (one per workspace, owned by the `documents` module; defaults apply until saved): `style` (below) and `defaults` (`terms[]`, `exclusions[]`, `clientProvides[]` pre-filled into new projects).

`style` (Settings → Documents, applies to every client-facing document):

```ts
{ template: 'classic',            // more templates later
  accent: '#b08d57',              // validated hex; text shades derived for ≥ 4.5:1 contrast
  cover: 'dark' | 'accent' | 'light', coverPattern: true,
  headingFont: 'serif' | 'sans', showLogo: true,
  coverImageKey?                  // R2 object key, when uploads arrive; dark overlay keeps text readable
}
```

`invoicing`: `{ prefix: 'INV', nextNumber, gstin?, stateCode?, sac: '998314', legalName?, address? }`. Numbers come from an atomic `$inc`, so they never repeat or skip.

**`clients`**: name, company, email, phone (WhatsApp), `currency?` (default for their projects; null = workspace default).

**`projects`** (`currency`: one of the supported codes; every amount below is minor units of it):

```ts
{ clientId, name, description, currency,
  status: 'draft' | 'awaiting_approval' | 'active' | 'completed' | 'archived',
  billingModel: 'upfront' | 'milestones',
  baseline: { items: [{ id, title, description, includes: string[], amount }], total, approvedAt?, approvalId? },
  proposal: {             // optional sections, rendered on the client's page and PDF
    title?, subtitle?, overview?, callout?,
    highlights: [{ value, label }],                 // "5 · Custom pages"
    timeline: [{ phase, duration, description, isMilestone }],
    clientProvides: string[], exclusions: string[], terms: string[],
    addons: [{ id, title, description, amount, unit? }],   // can become a CR later
    validUntil?
  },
  milestones: [{ id, name, percent, baseAmount, order }],
  portalTokenHash,        // client portal link
  totals: { baseline, approvedChanges, pendingChanges, paid, due }  // denormalised for dashboard
}
```

After the baseline is approved it is **locked**. Changes after that go through change requests only.

**`changeRequests`**:

```ts
{ projectId, number /* CR-001 */, title, description,
  items: [{ id, title, description, amount }], total,
  billing: { option: 'pay_now' | 'next_milestone' | 'final' | 'split' | 'milestone', milestoneId? },
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'withdrawn',
  sentAt?, decidedAt?, approvalId?, source?: { channel: 'whatsapp'|'email'|'call'|'other', note } }
```

**`approvals`** (insert-only, never updated):

```ts
{ projectId, subject: { type: 'baseline' | 'change_request', id },
  decision: 'approved' | 'rejected', comment?,
  snapshot: {...},         // exact content the client saw
  snapshotHash,            // sha256 of canonical JSON
  approver: { name, email }, ip, userAgent, decidedAt }
```

**`payments`** (one per amount due):

```ts
{ projectId, milestoneId?, label,
  lines: [{ kind: 'baseline' | 'change_request', refId, description, amount }],
  amount,
  status: 'due' | 'client_reported' | 'confirmed' | 'cancelled',
  clientReport?: { method, reference /* UTR */, proofKey?, paidOn, reportedAt },
  confirmation?: { method, reference?, receivedOn, confirmedAt, confirmedBy },
  history: [{ status, at, by, note }] }
```

Approving a change request **adds a line** to the matching payment (or creates a new `pay_now` payment).

**`invoices`** (Phase 5, one per payment request; issued invoices are never edited, only cancelled or credited):

```ts
{ projectId, paymentId, number /* INV-2026-001 */, issuedOn, dueOn,
  seller: { name, address, gstin? }, buyer: { name, company, address?, gstin? },
  lines: [{ description, sac?, amount }], subtotal,
  tax?: { type: 'cgst_sgst' | 'igst', rate, cgst?, sgst?, igst? }, total,
  status: 'issued' | 'paid' | 'cancelled', snapshotHash }
```

**`activity`**: project timeline (`project.created`, `baseline.approved`, `cr.sent`, `payment.confirmed`, …).

**Indexes:** `{ workspaceId, … }` on every collection, unique `portalTokenHash`, `{ projectId, number }` unique on change requests.

---

## 5. Roadmap

Each phase ends with something working and deployed. We finish and check one phase before starting the next.

### Phase 0: Foundation

- [x] Next.js + TS strict + Tailwind + shadcn/ui + ESLint/Prettier
- [x] Folder structure from §3
- [x] Typed env vars (Zod), `.env.example`
- [x] MongoDB Atlas connection helper (cached client) + `/api/health`
- [x] Verify the health check against a real Atlas cluster (`/api/health` reports the database up, locally and on Vercel)
- [x] `money` util (paise ↔ ₹ formatting, `Intl` en-IN), `hash` util, secure `token` util
- [x] Vitest set up for domain logic
- [x] PWA basics: web manifest, app icons, theme colour, installable
- [x] `output: "standalone"` (portable to Hostinger later)
- [x] First commit + push to GitHub + deploy to Vercel (`dev` branch, preview at scopelock-test.vercel.app)

**Done when:** the app deploys and a health page confirms it can reach the database.

### Phase 1: Auth & workspace

- [x] Typed collections helper + index setup script (`npm run db:indexes`)
- [x] Better Auth: email/password, password reset and email verification by 6-digit emailed code (hashed, 10 min, 5 tries), sessions, protected `(app)` layout. Google sign-in is ready and switches on when `GOOGLE_CLIENT_ID/SECRET` are set.
- [x] Workspace created at onboarding with the real business name (organization plugin), instead of an auto-named one at sign-up
- [x] Onboarding: business name, how you work, WhatsApp number, live "what your client sees" preview
- [x] App shell: sidebar/nav, mobile layout, settings page
- [x] Emails over SMTP when configured, printed to the terminal otherwise
- [x] ~~Logo upload~~: moved to Phase 3 (needs a Cloudflare R2 bucket; first shown on the client portal)
- [x] Google OAuth keys + SMTP provider for development (Google sign-in on Vercel, Gmail SMTP). Production SMTP on the real domain is a Phase 8 item.

**Done when:** I can sign up, finish onboarding and see an empty dashboard.

### Phase 1B: Marketing site

- [x] Landing page: pitch, how it works, client view, payments, evidence, pricing, FAQ, final CTA
- [x] Product visuals built as coded components (no screenshots), matching the real UI
- [x] `/pricing` with plan comparison. Plans live in one config (`modules/billing/domain/plans.ts`), made dynamic in Phase 8
- [x] Legal drafts: `/terms`, `/privacy`, `/refunds`, `/contact` (Razorpay requirement), filled from one `legal` config in `src/shared/config/site.ts`
- [x] SEO: per-page metadata, share image, `sitemap.xml`, `robots.txt`, structured data
- [x] CTAs: "Start free" → sign-up; plan buttons → `/sign-up?plan=…` (plan choice is used in Phase 8)
- [x] ~~Lawyer review, business details, domain~~: moved to the Phase 8 launch checklist (not needed to build the product)

**Done when:** the site is something I'd proudly share, and every Razorpay-required page exists.

### Phase 2: Clients & projects (baseline scope)

Build with the module recipe in `docs/CONVENTIONS.md` §2 (`scopedCollection`, `workspaceAction`, unit + integration tests).

- [x] Clients: add, edit, archive/restore (archive instead of delete so approvals and payments never lose who they were for), WhatsApp link, per-client project list
- [x] Create project → pick client (or add one inline) → baseline scope builder (deliverables + amounts + optional notes, live total in ₹)
- [x] Billing setup: upfront (stored as one 100% milestone) or milestones; whole-number percentages must add up to 100; exact amounts via `allocate()`; presets 30/30/40, 50/50, 40/60, all editable
- [x] Project list + project detail page; drafts can be edited or deleted (atomic draft-only writes); dashboard checklist reads real data

**Done when:** I can create the "Rahul – ₹80,000, 5 pages, 30/30/40" project.

### Phase 3A: Proposal content & document design

The client approves what they see, so the scope has to read like a proper proposal. This follows the layout of my Estimator quotation builder, not a plain table.

- [x] Project form: optional sections added with one click, so simple projects stay simple:
  - title and subtitle;
  - overview with a highlighted note;
  - highlight stats;
  - bullet points ("what's included") per scope line;
  - timeline;
  - what I need from you;
  - not included;
  - optional add-ons;
  - terms;
  - valid until.
- [x] Default terms and "not included" lists saved in Settings, so they're pre-filled on every new project
- [x] Document template **Classic**, one React component used for the in-app preview, the client portal and print:
  - cover with brand, title and prepared for/by;
  - highlights strip;
  - numbered sections;
  - scope cards;
  - investment;
  - payment schedule;
  - timeline;
  - add-ons;
  - needs and exclusions;
  - terms.
- [x] Settings → Documents, with a live preview:
  - accent colour (presets plus custom, with a readable-text check);
  - cover style (dark, accent or light, with optional rings; uploaded image comes with R2);
  - logo on or off;
  - serif or sans headings.
- [x] "Preview as client" on the project page
- [x] Print-ready A4 page: browser "Save as PDF", page breaks, a footer with page numbers. No PDF server needed.
- [x] Business logo and cover image upload (Cloudflare R2: private bucket, png/jpeg/webp, ≤ 5 MB, signed URLs). Resized in the browser, real file bytes checked on the server, random keys, old files deleted, "Photo" cover. Verified against the real bucket.

**Done when:** Rahul's project preview looks as good as my Estimator proposal, in my brand colour, on desktop and phone.

### Phase 3A+: Multi-currency

- [x] Currencies: INR, USD, EUR, GBP, AED, CAD, AUD, SGD. Money is integer minor units (`Minor`), formatted per currency (Indian grouping for ₹, international for the rest).
- [x] Workspace default currency (Settings → Business), defaulting to INR; not asked at onboarding
- [x] Client "Bills in" currency (optional; empty = workspace default)
- [x] Project currency: picked up from the client, changeable while a draft, locked once sent. Older projects read as INR.
- [x] Project form, tables, project list and the Classic proposal use the project's currency and symbol
- [x] Ambiguous amounts like "2.400" are rejected instead of guessed

**Done when:** a USD client's project shows "$2,400.50" everywhere, split 30/30/40 in cents, and INR projects are unchanged.

### Phase 3B: Client portal & baseline approval

- [x] Portal uses the Phase 3A document as the approval page
- [x] On send, store the proposal content as shown (including workspace defaults applied to older projects), so later changes to default text can't change a proposal that's already with the client
- [x] Require a confirmed account email before a portal link can be sent
- [x] Secret portal link (random token, only the hash stored) + copy button + WhatsApp share (`wa.me` link with a message ready to send)
- [x] Public portal `/c/[token]`: the Classic document in the freelancer's style, with an approval panel
- [x] Approve / Reject with name + email + optional comment
- [x] Approval record with a snapshot of everything shown (scope, proposal sections and **currency**), hash, IP and user agent. The baseline locks and the project becomes `active`.
- [x] Email to the freelancer on decision
- [x] Rate limiting + token revoke/regenerate
- [x] Security (see `docs/CONVENTIONS.md` §6): token format check + identical 404s, approve/reject resolve everything from the token, atomic status change + approval insert in one transaction, unique index per approved subject, `emailVerified` enforced in the send action
- [x] Evidence integrity: approvals insert-only in code; HMAC signature with a key derived from the app secret (not stored in the DB), re-checked on every read
- [ ] Atlas: a database user limited to find/insert on `approvals` for the app (deployment step, before launch)

**Done when:** Rahul approves from his phone and the freelancer sees "Approved on 4 Nov, 3:42 PM". ✓ (browser run at 390 px, 6 Nov 2026)

### Phase 4: Change requests

- [x] Create a CR: items + amounts, source (WhatsApp/call/email + note), billing option
- [x] Send → shows up in the portal (plus a direct deep link)
- [x] Client approves/rejects → approval record → project totals update
- [x] Freelancer can withdraw a CR that hasn't been decided
- [x] Turn a proposal add-on into a CR in one click (title, description and price pre-filled)
- [x] Project page: "Original ₹80,000 → Now ₹95,000" with a list of changes
- [x] Activity timeline
- [x] Client history on the portal link: everything the client did or was shared with them, newest first (proposal approved or changes asked, CRs approved or rejected; payments and invoices join in Phase 5). No IP addresses, fingerprints or internal notes.
- [x] Each answer in "Client answers" links to the exact version the client saw (rendered from the record's snapshot), so older proposal versions stay viewable

**Done when:** the blog + WhatsApp button CR (₹15,000) is approved and added to the final milestone. ✓ (browser run, 6 Nov 2026: "Before launch ₹12,800 + CR-001 ₹15,000")

### Phase 5A: Payments

- [x] Settings → payment methods (UPI, QR upload, bank, link, other; set a default)
- [x] Payments generated from milestones + approved CR lines (domain function with tests)
- [x] Where an approved CR's money goes is fixed when it's approved, and never lands in a payment already requested (it moves to the next one not yet requested, or a separate payment)
- [x] Link timeline milestones to payments: each milestone step picks the payment it unlocks (the advance is "before work starts"). The document shows it plainly: the timeline badge reads "Milestone · ₹28,800 due", and the payment schedule says when each payment falls due ("after week 2"). Marking that step done is what makes its payment due.
- [x] Mark a milestone as due → portal shows the amount + methods + **UPI QR code with the amount filled in** (UPI only for INR projects; foreign-currency projects offer SWIFT bank details, PayPal, Wise or a payment link)
- [x] Client "I've paid" → method, UTR, date, screenshot (R2: private bucket, random keys, png/jpeg/webp only with magic-byte check, ≤ 5 MB, signed URLs)
- [x] Freelancer confirms "Received" / "Not received", or marks it received directly
- [x] Emails: payment due (to client), client says paid (to freelancer), confirmed (to client)
- [x] Overview and project totals: received and due; payments due show under "Waiting on clients", "client says paid" under "Needs you"

**Done when:** Rahul pays ₹47,000 by UPI, uploads the UTR, and the freelancer confirms it. ✓ (browser run, 7 Nov 2026)

### Phase 5B: Invoices

- [x] Settings → Invoicing:
  - invoice prefix and starting number;
  - legal name and address;
  - optional GSTIN with state, and SAC code (default 998314, IT design and development);
  - LUT ARN for export invoices.
- [x] Clients: billing address, state, country and optional GSTIN (for GST and the invoice "billed to")
- [x] Each payment request becomes a numbered invoice (atomic counter per financial year, in the same transaction as the payment, so numbers never repeat or skip). Issued invoices are immutable; mistakes are fixed by cancelling the request (its invoice is cancelled with it) and asking again (new number). Paid when the payment is confirmed.
- [x] GST only when a GSTIN is set: CGST + SGST 9% + 9% within the same state, IGST 18% across states (domain function with tests)
- [x] Clients outside India get export-of-services invoices: zero-rated under LUT, with the Rule 46 endorsement, LUT ARN and country of destination (wording from the current Rule 46 text; a CA should review the format once before launch)
- [x] Final invoice includes the project statement: original scope, approved CRs, payments received, balance due
- [x] Invoice page in the client portal (logo and accent from the document style; printable), plus a print view for the freelancer

**Done when:** each payment Rahul is asked for comes with a numbered invoice he can open from his link, and the final one shows the full statement.

### Phase 6: PDFs

- [ ] PDFs of the proposal, change orders, invoices and the project statement, all in the Phase 3A template and document style
- [ ] Start with print-ready pages (browser "Save as PDF", like Estimator). Add server-generated PDF files for email attachments if needed, cached in R2 and regenerated when data changes.
- [ ] Download from the app and from the portal

**Done when:** the PDF is something I'd be happy to send a client.

### Phase 7: Dashboard & polish

- [ ] Dashboard: **"Revenue recovered"** (approved CRs this month/all time), pending approvals, payments due, payments to confirm. Totals are shown per currency (₹2,40,000 · $3,200), never summed across currencies.
- [ ] Reminders: resend approval/payment links
- [ ] Empty states, loading states, errors, mobile QA
- [ ] PWA polish: service worker, offline fallback page, "Install app" prompt, iOS home-screen support
- [ ] Use it on my own client projects and fix what hurts

**Done when:** I use ScopeLock on a real client project from start to finish.

### Phase 8: Launch

- [x] Landing page (pitch: _"How much extra work did you do last month without charging?"_): built in Phase 1B
- [ ] Plan limits enforced: **Free** (2 active projects) · **Pro** (₹499/month, 6 projects) · **Agency** (₹1,999/month, 15 projects, team later)
- [ ] Razorpay Subscriptions + webhook → plan limits applied in `billing` module (HMAC verified over the raw body, idempotent on event id)
- [ ] Terms, Privacy, Refund policy pages: drafts exist (Phase 1B); fill in registered business name, address, contact email, GSTIN and grievance officer in the `legal` config
- [ ] Legal pages reviewed by a lawyer / CA
- [ ] Buy the domain; set `APP_URL`, Google OAuth URLs and the email sender to it
- [ ] Sentry, basic analytics, Atlas backups check
- [ ] SMTP configured in production; `APP_URL` is the real https domain; `CLIENT_IP_HEADER` set for the host (nginx → `x-real-ip`)
- [ ] Playwright end-to-end suite in CI (sign-up → onboarding → scope → CR → approve → pay)
- [ ] Move hosting from Vercel Hobby to Hostinger (Vercel's free plan is non-commercial)

**Done when:** a stranger can sign up, pay and use it without my help.

### Later (after the MVP)

- Connected Razorpay with automatic payment confirmation
- WhatsApp capture: forward a message and get a draft CR. AI drafts a CR from a pasted message.
- Email OTP verification for approvers (stronger evidence)
- Retainer billing model
- Team members & roles (agencies)
- More document templates (e.g. Minimal, Bold) and per-project style overrides
- Saved proposal templates: reuse a past project's sections and scope as a starting point
- Value-based pricing display (standard value, discount, "You save"), as in Estimator
- E-invoicing (IRN) for freelancers above the GST e-invoice threshold
- Creative/design approvals (the WhatsApp-first proofing idea)

---

## 6. Validation track (alongside development)

- [ ] Run the change-order process by hand (Google Doc + UPI) on my own current clients
- [ ] Ask 15–20 freelance developers: _"How much extra work did you do last month without charging?"_
- [ ] Get 5 beta users to commit before Phase 7 ends
- [ ] Build in public (X / LinkedIn / r/developersIndia)

---

## 7. Progress log

| Date       | Phase     | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-04 | Planning  | Plan created. DB: MongoDB Atlas. PWA added. Hosting: Vercel free now, Hostinger later.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-11-04 | Phase 0   | Next.js 16.4 scaffold (Cache Components on), shadcn (Radix), shared utils + 21 tests, PWA manifest/icons, health route, standalone build verified locally. Waiting on Atlas URI + Vercel deploy.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-11-04 | Brand     | Logo chosen: **Focus Lock** (corner brackets framing a green core = agreed scope, locked in). Lowercase `scopelock` wordmark. Name kept: ScopeLock. Client portal will lead with the freelancer's branding + small "Powered by scopelock".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-11-04 | Phase 1   | Better Auth on MongoDB, proxy + server-side session checks, onboarding, app shell, settings. 56 unit tests; 26-step browser run (sign-up → onboarding → settings → verify email → sign-out → sign-in → password reset) passes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-11-04 | Phase 1B  | Marketing site: landing, pricing, terms, privacy, refunds, contact, share image, sitemap, robots. Pro ₹499, Agency ₹1,999. Business details are placeholders in `legal` config.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 2026-11-04 | Phase 1B  | Polish: Lenis eased scrolling on marketing pages (wheel + in-page links; touch and reduced-motion stay native), graph-paper `GridBackdrop` in hero and final CTA with pointer-lit lines on desktop, header blur removed. Scroll at 60fps with 4x CPU throttle.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-11-05 | Phase 1   | Email links replaced by 6-digit codes (Better Auth emailOTP): forgot password is email → code + new password → signed in; verify email is a code box in the app bar (soft verification kept). Codes hashed, 10 min, 5 tries, 6/min per IP. 15-step browser run passes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-11-05 | Hardening | Pre-Phase-2 audit (independent security + architecture reviews, findings verified against library source). Unused Better Auth HTTP routes disabled; email-OTP sign-up off; 1 workspace/account, deletion off; security headers + static CSP; client-IP header for rate limits; codes never logged in prod; https `APP_URL` enforced in prod; fresh-session + role checks on writes. `scopedCollection` + `withTransaction` + `workspaceAction` + `FormState`; client-safe `index.ts` / server-only `server.ts` per module; lint-enforced boundaries; stricter tsconfig; error/404 pages; integration tests on in-memory Mongo; CI workflow; `docs/CONVENTIONS.md`.                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-11-05 | Phase 2   | Clients and projects modules on `scopedCollection` + `workspaceAction`. Rahul's ₹80,000, 5-page, 30/30/40 project creates with exact ₹24,000/₹24,000/₹32,000 milestones. Unique form ids per instance (`useId`, Activity keeps pages mounted); India-time dates; signed-in pages noindex. 119 unit + 17 integration tests; 36-step browser run passes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-11-05 | Planning  | Added Phase 3A (proposal content + Classic document template + Settings → Documents customiser, modelled on my Estimator builder) before the portal (now 3B). Invoices with numbering and optional GST moved into Phase 5; PDFs in Phase 6 reuse the same template.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-11-05 | Phase 3A  | Proposal sections (overview, highlights, scope bullet points, timeline, add-ons, needs, exclusions, terms, valid until) on projects; `documents` module with the Classic template (one component for settings preview, "Preview as client" and A4 print), Settings → Documents (accent presets + custom with contrast guarantee, dark/accent/light cover, rings, serif/sans, initials) and default text. Logo/cover upload waits for R2. 157 unit + 19 integration tests; 27-step browser run plus all earlier suites pass.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-11-05 | Phase 3A  | Defaults apply to projects whose proposal was never saved (created before 3A) in both the edit form and Preview as client; once saved, the person's choice wins, even if a section was cleared. Settings preview always shows the full sample with the saved default text.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-11-05 | Polish    | Back links on every inner page (edit project → back to project, new project, add client) via a shared `BackLink`; "Client not listed?" link left-aligned (the form field was stretching it).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2026-11-05 | Phase 3A  | Logo + cover image upload built on Cloudflare R2 (aws4fetch, private bucket, signed URLs cached per hour). Browser resizes to WebP (strips EXIF); server checks real file bytes, caps 4 MB (Vercel limit), stores under `ws/<id>/<kind>/<random>`; replacing or removing deletes the old object. "Photo" cover style with a dark layer; logo on a white plate on dark covers. Switched off until R2 env vars are set.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-11-05 | Phase 3A  | Uploads verified live against the R2 bucket (18 checks: upload, signed URLs, replace deletes old object, remove, 5 MB and fake-image rejection). Fixed 411 Length Required on larger files (send raw bytes after signing). Photo cover layer deepened so text stays readable on bright photos. Phase 3A complete.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-11-05 | Phase 3A+ | Multi-currency: 8 two-decimal currencies; `Minor` units + `formatMoney`; workspace default (Settings), client "Bills in", project currency following the client until chosen. Form, tables, list and Classic proposal format per currency. Plan updated for UPI (INR only), export invoices under LUT, per-currency dashboard totals, currency in approval snapshots. 187 unit + 21 integration tests; 18-step currency browser run plus all earlier suites pass.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-11-06 | Polish    | Proposal sections are added at the bottom of the list (in the order added) and the new section gets focus; the client document keeps its fixed order. Starter "Terms" line made currency-neutral.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-11-06 | Phase 3B  | Client portal and baseline approval. Send freezes the proposal as shown (defaults included, issue date = send time) and needs a confirmed email (checked in the action). Secret link: SHA-256 hash for lookup + AES-GCM sealed copy so it can be copied again; copy + WhatsApp share; replace link; withdraw to edit; re-send keeps the link. Public `/c/[token]`: Classic document, approve or ask for changes (name, email, note), identical not-found page for every bad link, rate limits per IP and per link. Insert-only approval records with snapshot hash, IP, user agent and an HMAC signature (key outside the DB), written in one transaction with the status change; guarded on link + sent version; unique index blocks a second approval. Email to the freelancer on each answer. Project page shows the share card and signed answer history. 194 unit + 28 integration tests; 34-step browser run.                                                                                                                                         |
| 2026-11-06 | Phase 3B  | Fix: dev "Blocking Route" warning on `/c/[token]` (clock read during prerender in the rate limiter). `requestInfo()` now calls `connection()` first, so portal rendering waits for a real request. Verified on the dev server: issue gone.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-11-06 | Planning  | Phase 4 gains two items: a client-side history on the portal link, and viewing the exact version behind each client answer (from the approval snapshot). Test data: a fully filled draft "Nexsphere website redesign" (overview, highlights, timeline with milestones, 4 add-ons including the ₹15,000 blog + WhatsApp button) for change-request testing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-11-06 | Planning  | Phase 5: timeline milestones link to the payment they unlock, so the proposal shows which payment falls due when (today the milestone badge and the payment schedule don't know about each other).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-11-06 | Phase 4   | Change requests. `changes` module: CR-001… per project (atomic counter), lines + total, internal source note, billing (final / next / split / specific payment / separate), draft → sent → approved / declined, take back, cancel, delete unsent drafts, revise a declined one. Turn a proposal add-on into a CR in one click. Change order document in the Classic style; sent version frozen and signed on approval (same evidence, transaction and unique index as the proposal). Portal: the link becomes the client's project page (waiting CRs, total so far, CR list, client history) plus `/c/[token]/changes/[n]` deep links. `activity` module: insert-only event log, full on the project page, filtered and reworded for the client; existing projects backfilled from their records. "Agreed → Now" summary, payment schedule shows approved CRs, "View the version they saw" on every answer. 209 unit + 34 integration tests; 43-step browser run.                                                                                           |
| 2026-11-06 | Polish    | Project total moved into the agreed-scope footer (agreed total + approved changes = project total; pending changes noted as not counted yet), replacing the separate banner. Email logo: inline SVG (dropped by Gmail and Outlook) replaced with a PNG of the mark rendered from the brand geometry with `next/og` and attached inline (`cid:`), so it shows without loading remote images.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-11-06 | Polish    | Dashboard review and polish. Overview rebuilt: money at a glance per currency (approved work, waiting on clients, in draft), "Waiting on clients" oldest first with a WhatsApp Remind, "Needs you" (changes asked, drafts not sent), recent activity across projects; the setup checklist shows only until done. Projects list shows the project total incl. approved changes and "+ ₹X waiting". Phone project page puts the share card first. Signed-record details fold behind "Record details". Clients list shows project counts (no "No company"), settings uses the standard page width, save buttons are primary everywhere.                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2026-11-06 | Polish    | Overview activity kept short: latest 6 events, one line each (client notes stay on the project page), drafting a change left out (unsent drafts are under "Needs you"), "Full history is on each project's page". Money cards say "Nothing waiting" / "Nothing in draft" instead of "0 projects".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-11-06 | Structure | Routes made composition-only. New `overview` module (pure, tested builders for waiting / needs / setup / money; one `getOverview()` query; UI moved out of the route). Project page split into `ProjectHeader` / `ProjectSidebar`; share messages, form defaults (new / edit project, new / edit / revise CR) and verdict wording moved to module domains with tests; `cssString` to shared. Shared UI: `MoneyInput`, `FormSection`, `TitledSection`, `SideCard`. Pagination (20 per page, clamped) on projects, clients (active / archived) and a client's projects; lean project summaries for the overview; per-client counts via aggregate. Rules recorded in CONVENTIONS §5 and AGENTS.md. 229 unit + 37 integration tests; 13-step pagination run; all suites pass.                                                                                                                                                                                                                                                                                   |
| 2026-11-06 | Structure | Long lists bounded: the project page shows the latest 5 events and 3 client answers (compact rows) with "See all N", opening paged `/projects/[id]/activity` and `/projects/[id]/answers` (full signed records). Portal history capped at the latest 50. Big forms split into section components: project form (885 → 264 lines + client fields, scope lines, payment terms), proposal sections (669 → 175 + one file per section), change request form (519 → 263 + lines editor, billing choice); billing choices moved to the changes domain with a test. 230 unit + 37 integration tests; Phase 4 run 51/51 and all suites pass.                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2026-11-06 | Docs      | `docs/PRODUCT.md`: product brief for pitch decks and videos. Problem, four-step flow with the demo story, built vs coming features, advantages, how approvals are recorded, security, tech, pricing (planned), brand, roadmap, a 10-slide outline, a 60-second video script and a say / don't-say guide. Kept current as part of the definition of done.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-11-07 | Phase 5A  | Payments. Settings → Payments (UPI, bank incl. SWIFT/IBAN, payment link, QR image, other; default; validated live). Schedule built from milestones + approved CRs; where a CR's money goes is fixed at approval and never lands in a payment already requested. Timeline milestones link to the payment they unlock ("Milestone · ₹28,800 due", "After Design (Week 2)", "Before work starts"; "“Design” done: ask for…"). Ask for a payment (frozen lines, one open request per slot by index), cancel, mark received directly; client pay page with UPI QR (amount filled in, server-rendered SVG), UPI-app button, bank/link/QR/other; "I've paid" with UTR, date and screenshot (shrunk in browser, magic-byte checked, private, downloads only, 10-minute links); confirm / not received with a note. Four emails, payment activity, project and overview totals (Received, Due now), payments under Waiting on clients and Needs you. Shared `ImageUploadField` and `readImageUpload`. 249 unit + 41 integration tests; 34-step Phase 5A browser run. |
| 2026-11-08 | Phase 5B  | Invoices. Settings → Invoicing (legal name, address, GSTIN with state taken from it, SAC 998314, prefix and start number, LUT ARN; validated live; next number shown). Client billing details (address, state, country, GSTIN). Every payment request issues a numbered invoice ("AD/26-27/007", ≤ 16 characters, per financial year) in the same transaction as the payment; frozen snapshot with its hash; paid / cancelled follow the payment; a new request gets a new number. GST only with a GSTIN: CGST + SGST 9% + 9% in your state, IGST 18% across states (place of supply from the client's GSTIN or state); clients abroad zero-rated under LUT with the Rule 46 endorsement (needs the LUT ARN). Rule 46(e) check for unregistered clients at ₹50,000+. Final invoice carries the project statement. Client pays amount + GST (UPI QR, emails, activity); totals stay before GST. Invoice pages for the freelancer (print) and client (portal). 272 unit + 44 integration tests; 30-step Phase 5B browser run; 5A and 4 runs still pass.       |
| 2026-11-08 | Phase 5B  | Copy: Settings → Invoicing and client billing now explain that GST type is decided per invoice by comparing the client's state (from their GSTIN, else their billing state, else yours) with yours.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-11-08 | Phase 5B  | GST state fallback made visible: when GST applies and the client has no state or GSTIN, the "Ask for payment" confirmation says the invoice will use your state (CGST + SGST) and links to the client page. `gstHints()` in the invoices domain with tests; payment row forms split into `payment-forms.tsx` (actions file 400 → 233 lines). 274 unit tests; 31-step Phase 5B and 34-step 5A runs pass.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-11-08 | Phase 5B  | GST shown up front. Proposals and change requests carry `gstPercent` in what's sent (so the signed record includes it): "plus 18% GST" under the total and "Prices are before GST; 18% GST is added on each invoice" when you're registered and the client is in India. "Ask for payment" shows the exact figures before asking ("Ask for ₹28,320", "₹24,000 + ₹4,320 GST: IGST 18%") via `taxPreview()` (same rule as the invoice). Portal payments note amounts not asked for yet are before GST. 276 unit tests; 34-step Phase 5B, 5A and 4 runs pass.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 2026-11-08 | Phase 5B  | Payments show what the client pays. Schedule items carry `tax` and `payable` (from the invoice once asked for, else `withGst()` using the invoice rule, applied once in `scheduleFor`); `scheduleTotals()` gives received / due / total before GST and with it. Project page: rows show the amount with GST and "₹28,800 + ₹5,184 GST · Invoice …", footer "Total with GST", and "Plus ₹19,980 GST on invoices · ₹1,30,980 with GST" under the project total. Portal: totals before GST, GST on invoices, total with GST, paid so far with GST; payment rows "incl. GST". Split for size: payments panel → row / totals / badge; payment actions → `actions`, `confirm-actions`, `settings-actions`, `action-helpers`; payment form schemas → `payment-forms.ts`; invoice previews → `preview.ts`; portal totals → `portal-totals.tsx`. 280 unit + 44 integration tests; 38-step Phase 5B, 5A and 4 runs pass.                                                                                                                                              |
| 2026-11-08 | Structure | Tidy-up pass: no source file over 300 lines. Split by responsibility, no behaviour change: classic proposal (627 → shell, cover, scope sections, plan sections, section kit), change request domain (551 → core, `billing.ts`, `form-values.ts`), projects repository (503 → `project-docs`, `repository`, `portal-repository`), landing story (501 → one file per section), document style editor (382 → editor + pickers), payments repository (settings to `settings-repository`), portal decisions (proposal, `change-decision`, `decision-helpers`), project domain (core, `project-input`, `payment-timing`), overview setup checklist (`setup.ts`), milestone row input. 280 unit + 44 integration tests; all browser suites pass (phase 2, 3A, 3B, 4, 5A, 5B, UX, currency, pagination, defaults).                                                                                                                                                                                                                                                  |
| 2026-11-08 | Phase 5B  | Client documents show the cost with GST: the proposal's Investment box says "plus 18% GST (₹17,280)" and "₹1,13,280 with GST", each payment in the schedule shows its amount with GST, and change requests show "plus 18% GST (₹2,700) · ₹17,700 with GST". Worked out per payment from the rate saved in what was sent (`documents/domain/gst.ts`), with the invoices' rounding (`percentOf` now shared in `money.ts`). 283 unit + 44 integration tests; 39-step Phase 5B run, Phase 4, 3A and defaults pass.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-11-08 | Phase 5B  | Overview money matches the project page: Received and Due now count what clients pay, GST included (project `totals.paid` / `totals.due` from `payable`; existing project totals recomputed). Approved work and Awaiting approval stay before GST; when GST-registered the cards say so ("1 project · before GST", "Confirmed, GST included", "Asked for, GST included"). Unused `sumReceived` / `receivedByCurrency` removed. 283 unit + 44 integration tests; 40-step Phase 5B and 34-step 5A runs pass.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-11-09 | Docs      | Product record for design work (`/impeccable init`): `docs/PRODUCT.md` §16 adds Platform (web/PWA), Positioning (signed proof + India-native money + no-login client link), Operating Context (WhatsApp-first, laptop for writing, phone for quick tasks, clients on phones over mobile data), Evidence on Hand (none yet; demo story is illustrative), five Product Principles and known accessibility needs. Copilot hook file removed from the repo.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
