import { expect, test, type Page } from "@playwright/test";
import { button, codeFor, label, newEmail, signUpFreelancer } from "./helpers";

async function draftProject(p: Page, name: string) {
  await p.goto("/projects/new");
  await p
    .getByText("Client not listed? Add them here")
    .filter({ visible: true })
    .click({ timeout: 3000 })
    .catch(() => {});
  if (await label(p, "Client name").count()) {
    await label(p, "Client name").fill("Rahul Mehta");
    await button(p, "Add client", true).click();
  }
  await label(p, "Project name").fill(name);
  await label(p, "Deliverable 1", true).fill("Home page");
  await label(p, "Amount for deliverable 1, in INR").fill("20000");
  await button(p, "Create project").click();
  await p.waitForURL(/\/projects\/[0-9a-f]{24}$/);
  return p.url();
}

test("Free allows 2 active projects; archiving one frees a place", async ({
  page: p,
}) => {
  await signUpFreelancer(p, { email: newEmail("limits") });
  const first = await draftProject(p, "Website redesign");
  await draftProject(p, "Brochure design");

  await p.goto("/projects/new");
  await expect(
    p.getByRole("heading", { name: "Your plan is full" }),
  ).toBeVisible();
  await p.goto("/projects");
  await expect(
    p.getByText(/Your plan is full: 2 of 2 active projects/),
  ).toBeVisible();

  await p.goto(first);
  await button(p, "Archive project").click();
  await button(p, "Archive project").last().click();
  await expect(p.getByText(/Archived on/)).toBeVisible();

  await p.goto("/projects/new");
  await expect(label(p, "Project name")).toBeVisible();
});

test("an admin-only account puts a workspace on Pro", async ({
  page: p,
  browser,
}) => {
  const { email } = await signUpFreelancer(p, { email: newEmail("comp") });

  // The admin email has no workspace: it lands in the admin area.
  const adminCtx = await browser.newContext();
  const a = await adminCtx.newPage();
  const admin = "e2e-admin@scopelock.test";
  await a.goto("/sign-up");
  await label(a, "Your name").fill("ScopeLock Admin");
  await label(a, "Email", true).fill(admin);
  await label(a, "Password", true).fill("e2e-password-123");
  await button(a, "Create account").click();
  await a.waitForURL(/\/admin/);
  await expect(
    a.getByRole("heading", { name: "Confirm your email" }),
  ).toBeVisible();
  await a
    .locator("input[autocomplete=one-time-code]")
    .first()
    .fill(await codeFor(admin));
  await expect(a.getByRole("heading", { name: "Plans" })).toBeVisible();

  await a.goto(`/admin/workspaces?q=${encodeURIComponent(email)}`);
  await a.locator("main ul li a").first().click();
  await a.getByRole("radio", { name: /^Pro/ }).click();
  await label(a, "Reason (required)").fill("Beta user");
  await button(a, "Move to Pro").click();
  await expect(a.getByText(/is on Pro now/)).toBeVisible();
  await adminCtx.close();

  await p.goto("/settings/plan");
  await expect(
    p.getByText("ScopeLock put your workspace on Pro, free of charge."),
  ).toBeVisible();
});
