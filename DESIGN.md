---
name: ScopeLock
description: Lock the scope, price every extra, get it approved and paid.
colors:
  ink-navy: "#0b1220"
  ledger-emerald: "#0e9f6e"
  bright-emerald: "#34d399"
  settled-wash: "#e6f5ee"
  waiting-amber: "#b45309"
  waiting-wash: "#fdf3e3"
  waiting-ink: "#7a3d06"
  correction-red: "#c8372d"
  paper-white: "#ffffff"
  canvas-grey: "#f7f8fa"
  quiet-fill: "#f4f5f8"
  hover-fill: "#eef0f4"
  selected-fill: "#eceef2"
  muted-slate: "#5a6475"
  hairline: "#e3e6eb"
  field-edge: "#d6dae1"
  document-desk: "#ebe8e2"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  figure:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.12em"
  document-display:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "2.4rem"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.01em"
rounded:
  sm: "0.3rem"
  md: "0.4rem"
  lg: "0.5rem"
  xl: "0.7rem"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "40px"
components:
  button-primary:
    backgroundColor: "{colors.ink-navy}"
    textColor: "{colors.paper-white}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  button-outline:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink-navy}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  button-outline-hover:
    backgroundColor: "{colors.quiet-fill}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-navy}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.ink-navy}"
    rounded: "{rounded.lg}"
    padding: "4px 10px"
    height: "32px"
  ledger-panel:
    backgroundColor: "{colors.paper-white}"
    rounded: "{rounded.xl}"
    padding: "16px 20px"
  badge-settled:
    backgroundColor: "{colors.settled-wash}"
    textColor: "{colors.ink-navy}"
    rounded: "{rounded.pill}"
    height: "24px"
  badge-waiting:
    backgroundColor: "{colors.waiting-wash}"
    textColor: "{colors.waiting-ink}"
    rounded: "{rounded.pill}"
    height: "24px"
  badge-idle:
    backgroundColor: "{colors.quiet-fill}"
    textColor: "{colors.muted-slate}"
    rounded: "{rounded.pill}"
    height: "24px"
---

# Design System: ScopeLock

## Overview

**Creative North Star: "The Signed Ledger"**

ScopeLock looks like an accounts book that is also a contract. Every screen is a ledger of what was agreed, what was added, what was asked for and what was paid, and every figure on it has to be trustworthy at a glance. The interface is ink on white paper: hairline rules separate rows, numbers sit in tabular columns, and small monospaced labels name each column the way a printed ledger would.

Restraint is the personality. The app is a precise working tool for a freelancer at a laptop (and a quick check on the phone), so nothing decorates: no gradients, no glowing shapes, no icon grids, no cards stacked on shadows. Colour carries meaning, not mood: ink navy is the only action colour, emerald appears only when something is settled (approved, done, money received), and amber only when something is waiting. When the client sees a proposal, change request or invoice, the screen changes register: the document becomes a sheet of paper on a warm desk, set in a serif, because that is the artefact they are signing.

**Key Characteristics:**

- Ink on paper: navy text and actions on white, cool slate-tinted greys.
- Meaning-only colour: emerald means settled, amber means waiting, red means fix this.
- Ledger structure: rows divided by hairlines, figures right-aligned in tabular numerals.
- Mono uppercase labels for column heads and figure captions.
- Flat app surfaces; only client documents lift off the page.
- Compact and crisp: 32px controls, 8px corners, no ornament.

## Colors

A near-monochrome ink-and-paper palette with two signal colours that are never used for decoration.

### Primary

- **Ink Navy** (#0b1220): every primary action (buttons, links), all body text and headings, and the dark document cover. It is the brand's trust colour; actions are ink, not green.

### Secondary

- **Ledger Emerald** (#0e9f6e): approved, done, received, money recovered, the "Adds up to 100%" confirmation, and the focus ring. Also the core square of the Focus Lock mark.
- **Bright Emerald** (#34d399): the mark's core on dark backgrounds only.
- **Settled Wash** (#e6f5ee): background of "approved / received" badges and done strips, always with ink text.

### Tertiary

- **Waiting Amber** (#b45309): borders and dots for anything waiting on someone (due, client says paid, sent and unanswered).
- **Waiting Wash** (#fdf3e3) with **Waiting Ink** (#7a3d06): waiting badges, notices and the unpaid-figure highlight; the ink keeps AA contrast on the wash.
- **Correction Red** (#c8372d): field errors and destructive actions only, usually as a 10% tint behind red text.

### Neutral

- **Paper White** (#ffffff): the page and every panel.
- **Canvas Grey** (#f7f8fa): the app sidebar, sidebar cards and table footers (totals rows).
- **Quiet Fill** (#f4f5f8): idle badges, skeletons, hover on outline and ghost buttons.
- **Hover Fill** (#eef0f4): secondary surfaces and accents.
- **Selected Fill** (#eceef2): the active sidebar item.
- **Muted Slate** (#5a6475): secondary text, captions, helper text, idle labels.
- **Hairline** (#e3e6eb): every border and row divider.
- **Field Edge** (#d6dae1): input and select borders, a step darker than hairlines so fields read as editable.
- **Document Desk** (#ebe8e2): the warm backdrop behind a client document preview, so the white sheet reads as paper.

### Named Rules

**The Settled Green Rule.** Emerald appears only when something is settled: approved, done, received or recovered. Never as a button, a heading accent or decoration. Three fixed exceptions echo the mark: the Focus Lock core, the focus ring, and the active sidebar item's icon.

**The Ink Action Rule.** Every action is ink navy. A screen has at most one filled ink button for the next step; everything else is outline or ghost.

**The Waiting Amber Rule.** Amber marks only things waiting on a person (the client or you), and always pairs a wash background with waiting ink text, never amber text on white.

## Typography

**Display Font:** Geist (with ui-sans-serif, system-ui)
**Body Font:** Geist (with ui-sans-serif, system-ui)
**Label/Mono Font:** Geist Mono (with ui-monospace)
**Document Font:** Cormorant Garamond (with Georgia), client documents only

**Character:** One clean grotesque does all the work in the app, tightened slightly at heading sizes; a monospace carries the ledger's column labels. The serif is reserved for the documents a client signs, so the change of type signals the change from tool to contract.

### Hierarchy

- **Display** (600, 1.5rem, 1.25, -0.02em): page titles ("Overview", project names).
- **Figure** (600, 1.5rem, tabular numerals, -0.02em): headline money figures (overview cards, project total), right-aligned where they sit in a column.
- **Title** (600, 0.9375rem, 1.4): section headings ("Agreed scope", "Payments") and panel titles.
- **Body** (400, 0.875rem, 1.5): rows, descriptions, form text; prose capped near 65ch (`max-w-prose`).
- **Label** (400, 0.6875rem, uppercase, 0.12–0.14em tracking): mono column heads, card captions ("APPROVED WORK", "DRAFT", "LIVE PREVIEW").
- **Document display** (Cormorant Garamond 600, about 2.4rem, 1.08): titles and the total investment figure inside client documents.

### Named Rules

**The Tabular Figures Rule.** Every amount, count, date and reference number uses tabular numerals, so columns of money line up digit for digit.

**The Serif Is For Signing Rule.** Cormorant Garamond appears only inside client-facing documents (proposal, change request, invoice cover). The app chrome never uses it.

## Layout

A left sidebar (canvas grey) holds the workspace switcher and four destinations; the main column is white with a centred content container. Pages open with a title row (title left, the one primary action right), then stacked sections separated by space rather than boxes.

Detail pages use a two-column grid on desktop: the working column (scope, payments, change requests, activity) and an 18rem side column (share panel, client card). On phones the side column's main action moves to the top and everything stacks. Forms use a label column (about 14–15rem) beside the fields on desktop, stacking on phones. Client documents are capped at A4 width (210mm) and centred.

Spacing follows a 4px base with section gaps of 32–40px, panel padding of 16–20px, and row padding of 12–16px. Every screen must work at 390px wide with no sideways scrolling.

### Named Rules

**The Summary Then Log Rule.** Detail pages summarise the latest few items; full histories live on their own paged pages ("See all 12").

## Elevation & Depth

The app is flat. Depth comes from tone and hairlines: white panels with a 1px hairline border on a white page, canvas-grey sidebars and footers, and quiet fills for hover and selection. Shadows appear in exactly one role, the client document, which floats as a sheet of paper above the warm desk backdrop.

### Shadow Vocabulary

- **Paper sheet** (`box-shadow: 0 10px 40px -20px rgba(0,0,0,0.35)`): client documents (proposal, change request, invoice) in previews and the portal. Removed for print.
- **Menu** (Tailwind `shadow-md` / `shadow-lg`): dropdown menus and the mobile sheet only, as overlays.

### Named Rules

**The Flat Tool Rule.** App panels, cards and rows never carry shadows. If something needs to stand apart, give it a hairline border or a tone, not a shadow.

## Shapes

Gently rounded and consistent. Controls (buttons, inputs, selects) use an 8px radius (0.5rem); panels, lists and tables use a slightly larger 11px radius (0.7rem), so containers read softer than the controls inside them. Status badges are full pills. Rows inside a panel are square, divided by hairlines. Client documents use a near-square 2px corner, like paper.

## Components

### Buttons

Precise and restrained: compact, crisp, one clear next step.

- **Shape:** gently rounded (8px), 32px tall (28px small, 24px extra-small), 14px medium text.
- **Primary:** ink navy fill, white text; at most one per view, for the next step ("Send for approval", "Ask for ₹33,984").
- **Hover / Focus:** primary lightens to 80% ink; focus shows a 3px emerald ring at 50% plus an emerald border; pressing nudges the button down 1px.
- **Outline:** white with a hairline border, quiet fill on hover; the default for secondary actions ("Ask for payment", "+ Add a line").
- **Ghost:** no border, quiet fill on hover; for "Not yet", "Cancel" and icon buttons.
- **Destructive:** red text on a 10% red tint; used for cancel and remove actions.
- **Labels** say exactly what happens and show a pending label while running ("Saving…", "Asking…").

### Status badges

- **Style:** full pill, 24px tall, 12px medium text, a small dot for live states.
- **States:** Settled (settled wash, ink text, emerald dot: Approved, Received); Waiting (waiting wash, waiting ink, amber dot: Due, Client says paid, Waiting for Rahul); Idle (quiet fill, muted slate: Not requested, Draft).

### Ledger panels

The signature container: a white panel with a hairline border and 11px corners, holding rows divided by hairlines.

- **Rows:** a narrow mono index column ("01", "1", "+"), the item and its detail lines in the middle, the figure right-aligned in tabular numerals.
- **Footer:** totals sit in a canvas-grey footer separated by a hairline ("Agreed total", "Approved changes", "Project total" in figure type).
- **Background:** paper white; no shadow (see The Flat Tool Rule).

### Inputs / Fields

- **Style:** 32px tall, 8px corners, transparent background, field-edge border, 14px text; money inputs carry a currency prefix and right-aligned tabular digits.
- **Focus:** emerald border plus a 3px emerald ring at 50%.
- **Error:** red border and red ring tint, a plain sentence below saying what's wrong and what to do; validated live after the first blur.
- **Disabled:** 50% opacity on a field-edge tint.

### Navigation

- **Style:** canvas-grey sidebar; 32px items with 14px text and a 16px line icon, 6px corners; the active item sits on selected fill in ink medium with an emerald icon (the mark's echo), others in muted slate with a selected-fill hover.
- **Settings tabs:** text tabs on a hairline with a 2px ink underline for the active tab, scrolling sideways on narrow screens.
- **Mobile:** the sidebar becomes a sheet from the left.

### Money strip

The overview's four figure cells (Approved work, Received, Due now, Awaiting approval): a mono label, a large tabular figure, and a one-line caption that says what the number means. A cell turns waiting ink only when there is money waiting.

### Client document

The proposal, change request and invoice: an A4-width white sheet with the paper shadow on the warm desk, a dark (or accent, light, or photo) cover with the business name and a serif title, numbered serif sections, and an investment box with the total in serif figures. Invoices are plainer: no cover, a thin accent rule on top, and accounts-document structure.

## Do's and Don'ts

### Do:

- **Do** keep every action ink navy (#0b1220), with one filled button per view for the next step.
- **Do** reserve emerald (#0e9f6e) for approved, done, received and money recovered, and amber (#b45309 with #fdf3e3 / #7a3d06) for waiting.
- **Do** set every amount, date and reference in tabular numerals and right-align figures in columns.
- **Do** use mono uppercase labels (11px, 0.12em tracking) for column heads and figure captions.
- **Do** separate rows with hairlines (#e3e6eb) inside 11px-cornered panels, with totals in a canvas-grey footer.
- **Do** show real product content as the design: rupee amounts, CR numbers, client names, dates like "18 Nov, 3:42 pm".
- **Do** check every screen at 390px wide.

### Don't:

- **Don't** use gradients, glowing blobs or decorative illustrations.
- **Don't** add shadows to app panels or cards; only client documents and overlays lift.
- **Don't** put `rounded-2xl` plus a shadow on every block, or build icon-in-a-circle feature grids.
- **Don't** use emerald for buttons, links, headings or decoration.
- **Don't** centre everything in app screens; content is left-aligned, figures right-aligned.
- **Don't** use the serif in the app chrome; it belongs to client documents.
- **Don't** redraw the Focus Lock mark; use `<Logo />`, `<LogoMark />` and `<BrandLoader />`.
