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

**`clients`**: name, company, email, phone (WhatsApp).

**`projects`**:

```ts
{ clientId, name, description, currency,
  status: 'draft' | 'awaiting_approval' | 'active' | 'completed' | 'archived',
  billingModel: 'upfront' | 'milestones',
  baseline: { items: [{ id, title, description, amount }], total, approvedAt?, approvalId? },
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
- [ ] Verify the health check against a real Atlas cluster (needs `MONGODB_URI`)
- [x] `money` util (paise ↔ ₹ formatting, `Intl` en-IN), `hash` util, secure `token` util
- [x] Vitest set up for domain logic
- [x] PWA basics: web manifest, app icons, theme colour, installable
- [x] `output: "standalone"` (portable to Hostinger later)
- [ ] First commit + push to GitHub + deploy to Vercel

**Done when:** the app deploys and a health page confirms it can reach the database.

### Phase 1: Auth & workspace

- [x] Typed collections helper + index setup script (`npm run db:indexes`)
- [x] Better Auth: email/password, password reset, email verification, sessions, protected `(app)` layout. Google sign-in is ready and switches on when `GOOGLE_CLIENT_ID/SECRET` are set.
- [x] Workspace created at onboarding with the real business name (organization plugin), instead of an auto-named one at sign-up
- [x] Onboarding: business name, how you work, WhatsApp number, live "what your client sees" preview
- [x] App shell: sidebar/nav, mobile layout, settings page
- [x] Emails over SMTP when configured, printed to the terminal otherwise
- [ ] Logo upload, moved to Phase 3 (needs a Cloudflare R2 bucket; first shown on the client portal)
- [ ] Google OAuth keys + SMTP provider (config only, no code)

**Done when:** I can sign up, finish onboarding and see an empty dashboard.

### Phase 1B: Marketing site

- [x] Landing page: pitch, how it works, client view, payments, evidence, pricing, FAQ, final CTA
- [x] Product visuals built as coded components (no screenshots), matching the real UI
- [x] `/pricing` with plan comparison. Plans live in one config (`modules/billing/domain/plans.ts`), made dynamic in Phase 8
- [x] Legal drafts: `/terms`, `/privacy`, `/refunds`, `/contact` (Razorpay requirement), filled from one `legal` config in `src/shared/config/site.ts`
- [ ] Legal pages reviewed by a lawyer / CA before launch
- [x] SEO: per-page metadata, share image, `sitemap.xml`, `robots.txt`, structured data
- [x] CTAs: "Start free" → sign-up; plan buttons → `/sign-up?plan=…` (plan choice is used in Phase 8)
- [ ] Fill in registered business name, address, contact email, grievance officer; buy domain

**Done when:** the site is something I'd proudly share, and every Razorpay-required page exists.

### Phase 2: Clients & projects (baseline scope)

- [ ] Clients CRUD
- [ ] Create project → pick client → baseline scope builder (deliverables + amounts, live total)
- [ ] Billing setup: upfront or milestones (percentages must add up to 100, amounts calculated automatically, editable presets like 30/30/40 or 50/50)
- [ ] Project list + project detail page

**Done when:** I can create the "Rahul – ₹80,000, 5 pages, 30/30/40" project.

### Phase 3: Client portal & baseline approval

- [ ] Business logo upload (Cloudflare R2), shown on the portal
- [ ] Require a confirmed account email before a portal link can be sent
- [ ] Secret portal link (random token, only the hash stored) + copy button + WhatsApp share (`wa.me` link with a message ready to send)
- [ ] Public portal `/c/[token]`: business branding, project summary, deliverables, milestones
- [ ] Approve / Reject with name + email + optional comment
- [ ] Approval record with snapshot, hash, IP, user agent. Baseline locks and the project becomes `active`.
- [ ] Email to the freelancer on decision
- [ ] Rate limiting + token revoke/regenerate

**Done when:** Rahul approves from his phone and the freelancer sees "Approved on 4 Nov, 3:42 PM".

### Phase 4: Change requests

- [ ] Create a CR: items + amounts, source (WhatsApp/call/email + note), billing option
- [ ] Send → shows up in the portal (plus a direct deep link)
- [ ] Client approves/rejects → approval record → project totals update
- [ ] Freelancer can withdraw a CR that hasn't been decided
- [ ] Project page: "Original ₹80,000 → Now ₹95,000" with a list of changes
- [ ] Activity timeline

**Done when:** the blog + WhatsApp button CR (₹15,000) is approved and added to the final milestone.

### Phase 5: Payments

- [ ] Settings → payment methods (UPI, QR upload, bank, link, other; set a default)
- [ ] Payments generated from milestones + approved CR lines (domain function with tests)
- [ ] Mark a milestone as due → portal shows the amount + methods + **UPI QR code with the amount filled in**
- [ ] Client "I've paid" → method, UTR, date, screenshot (R2)
- [ ] Freelancer confirms "Received" / "Not received", or marks it received directly
- [ ] Emails: payment due (to client), client says paid (to freelancer), confirmed (to client)

**Done when:** Rahul pays ₹47,000 by UPI, uploads the UTR, and the freelancer confirms it.

### Phase 6: PDFs

- [ ] Change order PDF (one CR: what, why, price, billing, approval proof)
- [ ] Project statement PDF (baseline → all CRs → approvals → payments → balance)
- [ ] Download from the app + the portal. Cached in R2, regenerated when data changes.

**Done when:** the PDF is something I'd be happy to send a client.

### Phase 7: Dashboard & polish

- [ ] Dashboard: **"Revenue recovered"** (approved CRs this month/all time), pending approvals, payments due, payments to confirm
- [ ] Reminders: resend approval/payment links
- [ ] Empty states, loading states, errors, mobile QA
- [ ] PWA polish: service worker, offline fallback page, "Install app" prompt, iOS home-screen support
- [ ] Use it on my own client projects and fix what hurts

**Done when:** I use ScopeLock on a real client project from start to finish.

### Phase 8: Launch

- [ ] Landing page (pitch: _"How much extra work did you do last month without charging?"_)
- [ ] Plans + limits: **Free** (2 active projects) · **Pro** (~₹499–999/month) · **Agency** (₹1,999, 15 projects, team later)
- [ ] Razorpay Subscriptions + webhook → plan limits applied in `billing` module
- [ ] Terms, Privacy, Refund policy pages
- [ ] Sentry, basic analytics, Atlas backups check
- [ ] Move hosting from Vercel Hobby to Hostinger (Vercel's free plan is non-commercial)

**Done when:** a stranger can sign up, pay and use it without my help.

### Later (after the MVP)

- Connected Razorpay with automatic payment confirmation
- WhatsApp capture: forward a message and get a draft CR. AI drafts a CR from a pasted message.
- Email OTP verification for approvers (stronger evidence)
- Retainer billing model
- Team members & roles (agencies)
- GST-compliant invoices
- Creative/design approvals (the WhatsApp-first proofing idea)

---

## 6. Validation track (alongside development)

- [ ] Run the change-order process by hand (Google Doc + UPI) on my own current clients
- [ ] Ask 15–20 freelance developers: _"How much extra work did you do last month without charging?"_
- [ ] Get 5 beta users to commit before Phase 7 ends
- [ ] Build in public (X / LinkedIn / r/developersIndia)

---

## 7. Progress log

| Date       | Phase    | Notes                                                                                                                                                                                                                                      |
| ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-11-04 | Planning | Plan created. DB: MongoDB Atlas. PWA added. Hosting: Vercel free now, Hostinger later.                                                                                                                                                     |
| 2026-11-04 | Phase 0  | Next.js 16.4 scaffold (Cache Components on), shadcn (Radix), shared utils + 21 tests, PWA manifest/icons, health route, standalone build verified locally. Waiting on Atlas URI + Vercel deploy.                                           |
| 2026-11-04 | Brand    | Logo chosen: **Focus Lock** (corner brackets framing a green core = agreed scope, locked in). Lowercase `scopelock` wordmark. Name kept: ScopeLock. Client portal will lead with the freelancer's branding + small "Powered by scopelock". |
| 2026-11-04 | Phase 1  | Better Auth on MongoDB, proxy + server-side session checks, onboarding, app shell, settings. 56 unit tests; 26-step browser run (sign-up → onboarding → settings → verify email → sign-out → sign-in → password reset) passes.             |
| 2026-11-04 | Phase 1B | Marketing site: landing, pricing, terms, privacy, refunds, contact, share image, sitemap, robots. Pro ₹499, Agency ₹1,999. Business details are placeholders in `legal` config.                                                            |
