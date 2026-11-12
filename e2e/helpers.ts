import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, type Page } from "@playwright/test";

/** A fresh address for each test: accounts never collide. */
export const newEmail = (tag: string) =>
  `e2e+${tag}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@scopelock.test`;

// Written by e2e/serve.mjs (tests run from the project folder).
const LOG = path.join(process.cwd(), "e2e/.output/server.log");

/** The latest 6-digit code printed in an email to `to` (console transport). */
export async function codeFor(to: string): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const log = readFileSync(LOG, "utf8");
    const blocks = log
      .split("┌─ Email")
      .filter((b) => b.includes(`To:      ${to}`));
    const code = blocks.at(-1)?.match(/\b(\d{6})\b/)?.[1];
    if (code) return code;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`No code emailed to ${to}`);
}

/** Visible elements only: visited pages stay mounted in the background. */
export const label = (page: Page, text: string | RegExp, exact = false) =>
  page.getByLabel(text, { exact }).filter({ visible: true });

export const button = (page: Page, name: string | RegExp, exact = false) =>
  page.getByRole("button", { name, exact }).filter({ visible: true });

/**
 * A freelancer with a workspace and a confirmed email (sending to clients
 * needs it), signed in on `page`.
 */
export async function signUpFreelancer(
  page: Page,
  opts: { email: string; business?: string; name?: string } = {
    email: newEmail("freelancer"),
  },
) {
  const { email, business = "Asha Designs", name = "Asha Menon" } = opts;
  await page.goto("/sign-up");
  await label(page, "Your name").fill(name);
  await label(page, "Email", true).fill(email);
  await label(page, "Password", true).fill("e2e-password-123");
  await button(page, "Create account").click();
  await page.waitForURL("**/onboarding");
  await label(page, "Business name").fill(business);
  await page
    .getByRole("radio", { name: /Freelancer/ })
    .filter({ visible: true })
    .click();
  await label(page, /^WhatsApp number/).fill("99618 74527");
  await button(page, "Create workspace").click();
  await page.waitForURL("**/dashboard");
  // Confirm the email with the code from the banner, as a person would.
  await page
    .locator("input[autocomplete=one-time-code]")
    .filter({ visible: true })
    .first()
    .fill(await codeFor(email));
  await expect(page.getByText(/Confirm your email so/)).toHaveCount(0);
  return { email, business, name };
}

/** No sideways scrolling at the current width. */
export async function expectNoSideScroll(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}
