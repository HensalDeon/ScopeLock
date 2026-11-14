import type { Browser } from "@playwright/test";
import { expect } from "./fixtures";
import { button, codeFor, label } from "./helpers";

const ADMIN = "e2e-admin@scopelock.test";
const PASSWORD = "e2e-password-123";

/**
 * The platform admin (ADMIN_EMAILS on the e2e server) puts a workspace on
 * a plan by hand. Signs in, or signs up the first time.
 */
export async function setPlanAsAdmin(
  browser: Browser,
  ownerEmail: string,
  plan: "Free" | "Pro" | "Agency",
) {
  const ctx = await browser.newContext({
    extraHTTPHeaders: { "x-e2e-client-ip": `10.250.${Date.now() % 250}.1` },
  });
  const a = await ctx.newPage();
  await a.goto("/sign-in");
  await label(a, "Email", true).fill(ADMIN);
  await label(a, "Password", true).fill(PASSWORD);
  await button(a, "Sign in").click();
  const landed = await Promise.race([
    a
      .waitForURL(/\/admin/)
      .then(() => "admin")
      .catch(() => ""),
    // Not role=alert: Next's route announcer is one too.
    a
      .getByText("That email and password don't match")
      .waitFor()
      .then(() => "no account")
      .catch(() => ""),
  ]);
  if (landed !== "admin") {
    await a.goto("/sign-up");
    await label(a, "Your name").fill("ScopeLock Admin");
    await label(a, "Email", true).fill(ADMIN);
    await label(a, "Password", true).fill(PASSWORD);
    await button(a, "Create account").click();
    await a.waitForURL(/\/admin/);
  }
  // A new admin account confirms its email first.
  const first = a.getByRole("heading", {
    name: /^(Confirm your email|Plans)$/,
  });
  await expect(first).toBeVisible();
  if ((await first.textContent()) === "Confirm your email") {
    await a
      .locator("input[autocomplete=one-time-code]")
      .first()
      .fill(await codeFor(ADMIN));
    await expect(a.getByRole("heading", { name: "Plans" })).toBeVisible();
  }
  await a.goto(`/admin/workspaces?q=${encodeURIComponent(ownerEmail)}`);
  await a.locator("main ul li a").first().click();
  await a.getByRole("radio", { name: new RegExp(`^${plan}`) }).click();
  await label(a, "Reason (required)").fill("e2e");
  await button(a, `Move to ${plan}`).click();
  await expect(a.getByText(new RegExp(`is on ${plan} now`))).toBeVisible();
  await ctx.close();
}
