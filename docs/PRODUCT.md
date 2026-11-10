# ScopeLock: product brief

<!-- impeccable:product-schema 1 -->

> The source for pitch decks, demo videos, the website and investor or partner conversations. Every claim here is true of the product as built. Planned work is marked **Coming**. Update this file whenever a user-visible feature ships (see `docs/CONVENTIONS.md`, Definition of done).
>
> **Status as of 9 Nov 2026:** proposal, client approval, change requests, payments, invoices (with GST) and PDFs of every document, including the project statement, are built and tested. Not yet launched or charging.

---

## 1. In one line

**ScopeLock stops freelancers doing extra work for free.**

It records what the client agreed to, turns every extra request into a priced change request, and gets the client's signed approval before the work starts.

**Taglines we use**

- "Stop doing extra work for free."
- "From 'can you just add…' to paid, in four steps."
- "One link on WhatsApp. One tap to approve."
- "Approved today. Paid when your terms say."

**The question that opens every pitch:** _"How much extra work did you do last month without charging?"_

---

## 2. The problem

Freelancers and small studios in India agree a price for a project, and then the requests start. They come on WhatsApp, on a call, in an email:

- "Can you just add a blog?"
- "Small change: new colour scheme."
- "One more page, it won't take long."

**It's never one big request. It's ten small ones.** Each feels too small to price, so it gets done for free. By the end, the project has grown by a quarter and the price hasn't moved.

When the freelancer does ask for more money, there's no record of what was agreed. It's their word against the client's: _"But that was included."_ Most freelancers drop it to keep the relationship.

**Why it's worse in India**

- Most client conversations happen on WhatsApp, where agreements scroll away.
- There are few formal contracts on small projects.
- Freelancers chase payments by hand.

> For the pitch: add real numbers from the validation interviews (Plan §6: 15–20 freelance developers asked the opening question). Don't use made-up statistics.

---

## 3. Who it's for

Three audiences, of equal importance to the business:

- **Freelancers:** Indian freelance developers and designers building websites, apps and digital work for clients.
- **Studios:** small teams of 2 to 10 people doing the same work under a studio name.
- **Agencies:** larger teams (10+ people) running many clients at once. Team members on one workspace are coming.

Copy, pricing and examples speak to all three ("freelancers, studios and agencies"), never to freelancers first.

- **The client** (the person who approves and pays) never needs an account: they get a link.

**The person we picture:** Asha, a freelance web developer in Kochi. Her client is Rahul Mehta of Mehta Interiors. They agree a 5-page website for ₹80,000, paid 30/30/40. Two weeks in, Rahul asks for a blog and a WhatsApp chat button.

---

## 4. How it works (four steps)

1. **Lock the scope.** List what's included and the price, and turn it into a proper proposal (cover, overview, timeline, terms) in your own brand. Your client approves it from a link, so the baseline is agreed in writing before work starts.
2. **Log every extra request.** When a request comes in on WhatsApp, a call or email, log it with a price in under a minute, and note where it came from. Add-ons you listed in the proposal turn into a change request in one click.
3. **The client approves from their phone.** They get one link: what changed, what it costs and when it's billed. No login, no app. Their answer is saved as a signed record, with the date and time.
4. **Get paid on your terms.** Each change joins the next payment, the final payment, a chosen one, or is paid separately. When a milestone is done, ask for its payment in one tap: the client gets a page with a UPI QR code (amount filled in), your bank details or payment link, taps "I've paid" with the UTR and a screenshot, and you confirm it.

**The demo story (real numbers)**

- **Proposal:** Asha sends the ₹80,000 proposal; Rahul approves it on WhatsApp in one tap.
- **The extra request:** Rahul asks for a blog and a WhatsApp chat button. Asha logs **CR-001, ₹15,000**, "add to the final payment".
- **Approval:** Rahul approves from the same link. The project now reads **Agreed ₹80,000 + approved changes ₹15,000 = Project total ₹95,000**.
- **The payment that changes:** the "Before launch" payment becomes **₹32,000 + CR-001 ₹15,000**.
- **The proof:** if Rahul later says "that was included", Asha opens the signed record of exactly what he approved, and when.

---

## 5. What's built today

| Area                   | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Status           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| **Accounts**           | Email + password or Google sign-in; 6-digit email codes for confirming email and resetting passwords; one workspace per business (freelancer, studio or agency)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Built            |
| **Clients**            | Client list with WhatsApp number, company, email, billing currency and billing details for invoices (address, state, GSTIN); archive without losing history                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Built            |
| **Projects and scope** | Priced scope lines with notes and bullet points; upfront or milestone payments (30/30/40 quick splits) that always add up exactly                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Built            |
| **Proposals**          | Optional sections: cover title, overview, highlights, timeline with milestones, optional add-ons, "what I need from you", "not included", terms, valid-until date. Default text set once in Settings                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Built            |
| **Document design**    | "Classic" template; accent colour (presets or custom, readability checked automatically); dark, accent, light or photo cover; your logo and cover image; serif or sans headings. Live preview with a full sample                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Built            |
| **Client portal**      | One private link per project. The client reads the proposal on their phone and approves or asks for changes. Becomes their project page: changes waiting for them, total so far, every change, their history                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Built            |
| **Change requests**    | CR-001, CR-002… with priced lines; billing options (final payment, next payment, split, a chosen payment, or a separate payment); send, take back, cancel, revise a declined one                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Built            |
| **Signed records**     | Every approval and "no" is saved with what the client saw, who, when and from where, and checked against its signature every time it's shown. "View the version they saw" for any answer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Built            |
| **Overview**           | Money at a glance (approved work, waiting on clients, in draft); "waiting on clients" with a one-tap WhatsApp reminder; "needs you"; recent activity                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Built            |
| **Activity**           | A full history of every project, for you; a simpler version for your client                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Built            |
| **Multi-currency**     | INR, USD, EUR, GBP, AED, CAD, AUD, SGD. Each project has one currency; totals are never mixed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Built            |
| **Emails**             | Sign-in codes; a notice to you whenever a client approves or answers; ScopeLock logo in every email                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Built            |
| **Installable app**    | Installs on a phone or desktop like an app (PWA)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Built            |
| **Payments**           | Your payment methods (UPI, bank incl. SWIFT/IBAN, payment link, QR image, other). Ask for a payment in one tap; the client's page shows the amount, a UPI QR code with the amount filled in, a "Pay with a UPI app" button, your bank details or link. They tap "I've paid" with the UTR and a screenshot; you confirm it, say "not received" with a note, or mark it received yourself. Timeline milestones show which payment they unlock. Emails at every step; "received" and "due now" on the overview. Each approved project opens with where its money stands (received, due, still to ask for, total) and the one next step                                                                                                    | Built            |
| **Invoices**           | A numbered invoice with every payment you ask for ("INV/26-27/007"; numbers never repeat or skip, and restart each financial year). With a GSTIN: a tax invoice with CGST + SGST or IGST at 18% and the place of supply; clients abroad get a zero-rated export invoice under your LUT. Proposals and change requests show the GST and the total with it ("₹96,000 plus 18% GST · ₹1,13,280 with GST"), asking for a payment shows the exact GST first, and payments and project totals show what the client actually pays, GST included. Without a GSTIN: a plain invoice. The final invoice shows the whole project: original scope, approved changes, paid and balance. Your client opens it from their link and prints or saves it | Built            |
| **PDFs**               | Every document saves as a clean A4 PDF from the browser (Save PDF in the app and on the client's link): the proposal, change orders, invoices, signed records and the project statement (scope, every change, every payment and the totals). Each file is named after the document ("Tax invoice AD-26-27-010 · Asha Menon"). Invoices carry the pay-to details as they were when issued, the total in words, a signature line, and a clear "Cancelled" mark naming the replacement. The client's answer prints on the document itself                                                                                                                                                                                                 | Built            |
| **Subscriptions**      | Free, Pro and Agency plans with Razorpay                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Coming (Phase 8) |

---

## 6. Why ScopeLock (advantages)

**For the freelancer**

- **Paid for every extra.** Scope creep becomes priced, approved work instead of a favour.
- **Proof, not arguments.** "That was included" is settled by a signed record of exactly what the client saw and approved.
- **Fast.** Logging a request takes under a minute; sending is one tap on WhatsApp.
- **Looks professional.** Proposals and change requests in your brand, not a WhatsApp message or a Word file.
- **Flexible billing.** Approving and paying are separate steps. You decide whether a change is paid now, with the next milestone, at the end, or split.
- **Your money, directly.** ScopeLock never holds or routes client money: clients pay you by UPI, bank transfer or your own link.
- **Knows what's waiting.** The overview shows what clients haven't answered and what's due, and nudges them in one tap.
- **Paid faster.** A UPI QR with the amount already filled in, and a "client says paid" step with the UTR, so you only check and confirm.

**For their client**

- **Nothing to install, no account.** A link that opens on their phone.
- **Clear.** What changed, what it costs, when it's billed: before any work starts.
- **A fair record for both sides.** The client gets the same history and can see what they approved.

**Compared with what freelancers do today**

| Today                                        | With ScopeLock                                                                           |
| -------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Agreements scattered across WhatsApp chats   | One locked scope, approved from a link                                                   |
| Extras done free to avoid an awkward ask     | Each extra priced and sent in a minute                                                   |
| "I never agreed to that"                     | A signed record of exactly what was approved, and when                                   |
| Quotes in Word or PDF, edited after the fact | Versions frozen when sent; the approved one can't change                                 |
| Chasing payments by memory                   | Every payment due, reported and confirmed in one place, with a one-tap WhatsApp reminder |

---

## 7. Trust: how approvals are recorded

This is what makes ScopeLock more than a quoting tool. Use it in pitches; keep the wording plain.

- **Frozen when sent.** When a proposal or change request is sent, its exact content is frozen. Later edits to the project or settings can't change what the client is approving.
- **A copy of exactly what they saw.** Each answer saves the full document the client was shown.
- **A fingerprint.** That copy gets a SHA-256 fingerprint. Any change to it, even one character, changes the fingerprint.
- **A signature.** Every record is signed with a secret key that is not stored in the database, so someone with database access alone can't edit a record without it showing.
- **Checked every time.** Every time a record is shown, ScopeLock re-checks its fingerprint and signature and shows "Intact" or flags it in red.
- **Can only be added, never edited.** Approval records are insert-only in the code: there's no update or delete path.
- **No double approvals.** A double tap or two tabs can't approve the same thing twice (enforced by the database itself).
- **Who, when and where.** The name and email the client typed, the date and time, their IP address and browser.

---

## 8. Security (plain-language version)

- **Accounts**
  - Passwords of at least 8 characters, or Google sign-in.
  - 6-digit email codes expire in 10 minutes and allow 5 tries; how often they can be requested is limited.
  - Sensitive changes re-check the session against the database, not a cached copy.
- **Every business's data is walled off.** Every database query is pinned to the signed-in workspace by design, so one business can never read another's data. Tests check this.
- **Client links**
  - Each link is a random 256-bit secret. Only its fingerprint is stored, plus a copy locked with a key that isn't in the database, so a database leak doesn't give away working links.
  - Links can be replaced in one click; the old one stops working at once.
  - Mistyped, old and made-up links all show the same "This link doesn't open" page.
  - Client pages are hidden from search engines, never cached, and don't leak the link to other sites.
- **Abuse limits.** Page views and client answers are rate-limited per connection and per link.
- **Files**
  - Logos, cover images, payment QR codes and payment screenshots live in a private storage bucket, served through short-lived signed links. Clients' screenshots only ever download (10-minute links); they're never shown inside our pages.
  - Uploads are checked by their actual file contents (PNG, JPEG or WebP only), resized, and stripped of photo metadata such as location.
- **Web security**
  - A strict content security policy, HTTPS enforced (HSTS), no framing by other sites (clickjacking protection), no content-type sniffing, and tight browser permissions.
  - Secrets live in the server environment, never in code or the database.
- **Money accuracy.** All amounts are stored as whole paise (or cents), never decimals, so totals and splits always add up exactly.

---

## 9. Technology

| Layer       | Choice                                                                                        | Why                                                                                              |
| ----------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| App         | **Next.js 16** (App Router, React Server Components, Server Actions), **TypeScript** (strict) | Pages arrive with their data already in them: fast on mobile data, and no separate API to secure |
| UI          | Tailwind CSS, shadcn/ui (Radix)                                                               | Accessible components, consistent design system                                                  |
| Database    | **MongoDB Atlas**                                                                             | Transactions for approvals; flexible documents for proposals                                     |
| Auth        | Better Auth (email + password, Google, email codes)                                           | Self-hosted, no per-user fees                                                                    |
| Validation  | Zod                                                                                           | The same rules check forms in the browser and on the server                                      |
| Files       | Cloudflare R2 (private bucket, signed links)                                                  | Low cost, S3-compatible                                                                          |
| Email       | SMTP (Nodemailer)                                                                             | Works with any provider                                                                          |
| Hosting     | Vercel now; built to run on any Node server (Hostinger later)                                 | No lock-in                                                                                       |
| App install | PWA                                                                                           | Installs on phone and desktop                                                                    |
| QR codes    | `qrcode` (UPI QR with the amount, drawn on the server)                                        | Nothing about the payment goes to a third-party image service                                    |
| Coming      | Razorpay (subscriptions), Sentry, server-made PDF files for email attachments                 | Phases 7–8                                                                                       |

**Engineering quality**

- A modular codebase: each business area (projects, changes, approvals, portal…) is a self-contained module with tested rules.
- **283 unit tests**, **44 database integration tests** (against a real MongoDB), and browser tests that drive the whole flow (sign-up → proposal → client approval → change requests → payment requested with its GST invoice → client pays by UPI → confirmed) on desktop and phone widths. All run on every push.

---

## 10. Pricing (planned, Phase 8)

Not live yet; prices may change before launch.

| Plan       | Price          | For                                                   | Includes                                                                                                                             |
| ---------- | -------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Free**   | ₹0             | Trying it on your next project                        | 2 active projects, unlimited change requests, client approval links, payment tracking                                                |
| **Pro**    | ₹499 / month   | Freelancers and small studios with a full client list | 6 active projects, your logo on client pages and PDFs, no ScopeLock branding for clients, payment reminders, full project statements |
| **Agency** | ₹1,999 / month | Studios and agencies                                  | 15 active projects, revenue-recovered reports, priority support, team members (coming)                                               |

**The value in one line:** one recovered change request (₹15,000 in the demo story) pays for over two years of Pro.

---

## 11. Brand

- **Name:** ScopeLock (wordmark written lowercase: `scopelock`).
- **Mark: "Focus Lock".** Two corner brackets framing a green square, the way a camera locks focus. The brackets are the agreed scope; the green core is the work inside it, locked in. Always use the official files (`src/shared/ui/brand`), never redraw it.
- **Colours**
  - Ink navy `#0B1220` (trust, actions).
  - Emerald `#0E9F6E`, only for approved, done or money recovered.
  - Amber for waiting.
- **Voice**
  - Plain and specific, written like someone who knows freelancing in India.
  - Sentence case, real amounts in rupees, real names (Rahul Mehta, Mehta Interiors).
  - No exclamation marks, no emoji, no hype words ("supercharge", "seamless", "unlock").
- **Visual style:** calm and document-like. No gradients, glowing blobs or generic icon grids.

---

## 12. Roadmap

| Phase | What                                                                                                                                                      | Status  |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 0–1   | Foundation, accounts, workspace, marketing site                                                                                                           | Done    |
| 2     | Clients and projects (scope, milestones)                                                                                                                  | Done    |
| 3A    | Proposal content and document design (logo, cover, colours)                                                                                               | Done    |
| 3B    | Client portal and signed baseline approval                                                                                                                | Done    |
| 4     | Change requests, client history, signed versions                                                                                                          | Done    |
| 5A    | Payments: UPI QR with amount, bank, links, "I've paid" with UTR and screenshot, confirmation, timeline-linked milestones                                  | Done    |
| 5B    | Numbered invoices with optional GST, export under LUT, final statement, invoice page for clients                                                          | Done    |
| 6     | PDFs of every document                                                                                                                                    | Done    |
| 7     | Dashboard and polish; real use on my own client projects                                                                                                  | Next    |
| 8     | Launch: plans and Razorpay, legal pages, domain, monitoring                                                                                               | Planned |
| Later | Automatic payment confirmation, WhatsApp capture (forward a message, get a draft CR), approver email codes, retainers, teams, more templates, e-invoicing | Ideas   |

---

## 13. Ready-made outlines

**Pitch deck (10 slides)**

1. Title: _ScopeLock: stop doing extra work for free._
2. The question: _"How much extra work did you do last month without charging?"_ (plus interview numbers).
3. The problem: ten small WhatsApp requests, no record, "that was included".
4. The solution in four steps (§4).
5. Demo story: ₹80,000 website → CR-001 ₹15,000 → approved from WhatsApp → project total ₹95,000.
6. The client side: one link, no login, one tap (phone screenshot of the portal).
7. Trust: frozen versions, fingerprint, signature, "Intact" check (§7).
8. Money: approval separate from payment; UPI/bank/link; ScopeLock never holds money.
9. Pricing and the "one change pays for two years" line.
10. Roadmap and the ask.

**Demo video (about 60 seconds)**

- **0–8 s:** the opening question over a WhatsApp chat full of "can you just…" messages.
- **8–20 s:** lock the scope. Show the proposal in brand colours, then the client approving on a phone.
- **20–35 s:** "Can you add a blog?" Log CR-001 at ₹15,000 and send it on WhatsApp.
- **35–45 s:** the client taps Approve. The project total updates to ₹95,000, and the final payment grows.
- **45–55 s:** "That was included?" Open the signed record of what they approved.
- **55–60 s:** "ScopeLock. Stop doing extra work for free." Show the logo.

**Screens worth capturing:** Overview, project page (scope + project total), proposal preview, client portal on a phone, change request page, signed record ("View the version they saw").

---

## 14. Say / don't say

| Say                                                                                          | Don't say                                                                                               |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| "A signed record of exactly what your client approved, and when"                             | "Legally binding" or "court-proof" (we haven't had legal review; Phase 8)                               |
| "ScopeLock never holds your money; clients pay you directly"                                 | "We process payments" or "payment gateway"                                                              |
| "Every document saves as a PDF from the browser"                                             | That PDFs are emailed as attachments (they're shared by link or saved by the client)                    |
| "Free to start; planned Pro ₹499 / month"                                                    | Final prices or "free forever" (pricing goes live in Phase 8)                                           |
| "Built for Indian freelancers; GST invoices with CGST + SGST or IGST, and exports under LUT" | "Fully GST compliant" or e-invoicing (IRN) claims (a CA should review the format; e-invoicing is later) |
| "Your data is walled off per business; links are secret and replaceable"                     | "Bank-grade" or "military-grade" security, or certifications we don't hold                              |
| Real examples (Rahul Mehta, ₹15,000 blog + WhatsApp button)                                  | Invented statistics or customer counts                                                                  |

---

## 15. Glossary

- **Baseline / agreed scope:** what the client approved at the start: the price, the lines and the payment terms.
- **Change request (CR):** extra work after the baseline, with its own price, sent for approval. Numbered CR-001, CR-002…
- **Client portal / link:** the private page the client opens from WhatsApp. No login.
- **Signed record:** the saved, fingerprinted, signed copy of exactly what the client saw when they answered.
- **Milestone payment:** a share of the price due at a stage (e.g. 30% advance, 30% at design approval, 40% before launch).
- **UTR:** the bank reference number of a UPI or bank payment, which the client reports when they pay.

---

## 16. Product record (for design work)

The sections below are the durable product facts design work starts from (they are read by the Impeccable design skill). Visual decisions live in code and, later, `DESIGN.md`, not here.

### Platform

web

A responsive web app, installable as a PWA. The freelancer's app and the client's portal are both web.

### Positioning

Three things together that a neighbouring product can't truthfully claim:

- **Proof of what was agreed.** Every proposal and change request is frozen when sent, and every answer is saved as a fingerprinted, signed record that is re-checked each time it's shown (§7).
- **India-native money.** UPI QR codes with the amount filled in, the client's "I've paid" with the UTR, and GST tax invoices (CGST + SGST or IGST, exports under LUT). ScopeLock never holds the money.
- **No friction for the client.** One link, usually sent on WhatsApp; no account, no app, one tap to approve.

### Operating Context

- **Where conversations happen:** WhatsApp first, then calls and email. Requests arrive as small messages ("can you just add…"), not formal briefs.
- **The freelancer:** writes proposals and change requests on a laptop; uses the phone for quick tasks between calls: sending a link on WhatsApp, checking whether a client answered or paid, confirming a payment.
- **The client:** opens the link on a phone, from WhatsApp, often on mobile data. Pays with a UPI app or a bank transfer (NEFT / IMPS / RTGS), then reports the UTR.
- **Money and paperwork:** amounts in rupees (other currencies supported), milestone splits like 30/30/40, GST invoices numbered per financial year (April to March), documents printed or saved as PDF to share or file.

### Evidence on Hand

- **No real users, testimonials, interview results or customer numbers exist yet** (as of 9 Nov 2026). Every proof slot on the site, in decks or in the app stays empty or uses clearly illustrative content until real data exists. Never invent statistics, quotes, logos or counts.
- **The demo story is illustrative:** Asha (freelancer, Kochi), Rahul Mehta of Mehta Interiors, a ₹80,000 website, CR-001 ₹15,000. Use it as an example, never as a customer story.
- **Real assets:** the Focus Lock mark and wordmark (`src/shared/ui/brand`), and the working product itself, which can be screenshotted for any surface.

### Product Principles

1. **Proof over persuasion.** Anything a client agrees to leaves a frozen, verifiable record; nothing changes after it's sent.
2. **No friction for the client.** One link, no login, works on a phone over mobile data; every client screen must be understood in seconds.
3. **Money is exact and stays the freelancer's.** Whole paise, figures that match the invoice to the paisa, and clients paying the freelancer directly.
4. **Written like an Indian freelancer would say it.** Plain, specific, real rupee amounts and names; no hype.
5. **Only true claims.** Built is built, planned is marked Coming, and no number is shown that wasn't measured.

### Accessibility & Inclusion

No formal standard (such as WCAG 2.2 AA) has been chosen yet. Established needs: every screen works at 390px wide with no sideways scrolling; client pages load fast on mobile data; copy is plain English that a non-technical client follows; amounts use Indian formatting (₹1,13,280).
