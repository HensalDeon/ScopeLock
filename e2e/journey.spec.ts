import { devices, expect, test, type Page } from "./fixtures";
import {
  button,
  expectNoSideScroll,
  label,
  newEmail,
  signUpFreelancer,
} from "./helpers";

/**
 * The core journey: scope → approval → a priced change → payment, with the
 * client on a phone and the freelancer on a laptop.
 */
test("scope, approval, a change request and a payment, end to end", async ({
  page: p,
  browser,
}) => {
  const client = await browser.newContext({ ...devices["Pixel 7"] });
  const c = await client.newPage();

  await signUpFreelancer(p, { email: newEmail("journey") });

  // Payment details (asking for money needs them).
  await p.goto("/settings/payments");
  await label(p, "UPI ID").fill("asha@okhdfc");
  await label(p, "Name on UPI").fill("Asha Menon");
  await label(p, "Default method").selectOption("upi");
  await button(p, "Save payment details").click();
  await expect(p.getByText("Payment details saved.")).toBeVisible();

  // A project for a new client, with an add-on to turn into a change later.
  await p.goto("/projects/new");
  await p
    .getByText("Client not listed? Add them here")
    .filter({ visible: true })
    .click({ timeout: 3000 })
    .catch(() => {});
  await label(p, "Client name").fill("Rahul Mehta");
  await label(p, "WhatsApp number (optional)").fill("98765 43210");
  await button(p, "Add client", true).click();
  await label(p, "Project name").fill("Website redesign");
  for (const [i, line] of [
    "Home page",
    "About page",
    "Services page",
    "Contact page",
  ].entries()) {
    if (i) await button(p, "Add a line").click();
    await label(p, `Deliverable ${i + 1}`, true).fill(line);
    await label(p, `Amount for deliverable ${i + 1}, in INR`).fill("20000");
  }
  await button(p, "Optional add-ons").click();
  await label(p, "Add-on 1 name").fill("Blog + WhatsApp chat button");
  await label(p, "Add-on 1 price, in INR").fill("15000");
  await button(p, "Create project").click();
  await p.waitForURL(/\/projects\/[0-9a-f]{24}$/);
  const projectUrl = p.url();

  // Send it; the client approves on their phone.
  await button(p, "Send for approval").click();
  await expect(p.getByRole("heading", { name: /Waiting for/ })).toBeVisible();
  const portal = await label(p, "Client link", true).first().inputValue();

  await c.goto(portal);
  await expectNoSideScroll(c);
  await c.getByRole("link", { name: "Approve or ask for changes" }).click();
  await approve(c, "Approve for ₹80,000");

  // The add-on becomes CR-001, which the client approves too.
  await p.goto(projectUrl);
  await p
    .getByRole("link", { name: "Turn into a change request" })
    .filter({ visible: true })
    .click();
  await p.waitForURL(/changes\/new/);
  await button(p, "Save draft").click();
  await p.waitForURL(/\/changes\/1$/);
  await expect(p.getByText("Draft, not sent")).toBeVisible();
  await button(p, "Send to Rahul").click();
  await expect(
    p.getByRole("heading", { name: "Waiting for Rahul" }),
  ).toBeVisible();

  await c.goto(`${portal}/changes/1`);
  await approve(c, "Approve for ₹15,000");

  // The change lands on the last payment: ₹32,000 + ₹15,000.
  await p.goto(projectUrl);
  const finalRow = payRow(p, "Before launch");
  await expect(finalRow.getByText("₹47,000")).toBeVisible();

  // Ask for it; the client says they paid by UPI; the freelancer confirms.
  await finalRow.getByRole("button", { name: "Ask for payment" }).click();
  await button(p, "Ask for ₹47,000", true).click();
  await expect(
    payRow(p, "Before launch").getByText("Due", { exact: true }),
  ).toBeVisible();

  await c.goto(portal);
  await c
    .getByRole("link", { name: /Before launch.*Pay/ })
    .filter({ visible: true })
    .click();
  await c.waitForURL(/\/pay\//);
  await expectNoSideScroll(c);
  await expect(
    c.getByRole("heading", { level: 1, name: /₹47,000/ }),
  ).toBeVisible();
  await button(c, "I've paid ₹47,000").click();
  await label(c, "UTR or transaction ID").fill("431209876543");
  await button(c, "Send to Asha Designs").click();
  await expect(c.getByText(/You said you paid on/)).toBeVisible();

  await p.goto(projectUrl);
  await p
    .locator("section[aria-label='Where the money stands']")
    .getByRole("button", { name: "Confirm received" })
    .click();
  await expect(
    payRow(p, "Before launch").getByText(/Received on .* · UPI · 431209876543/),
  ).toBeVisible();

  await c.reload();
  await expect(c.getByText(/^Paid\./)).toBeVisible();
  await client.close();
});

const payRow = (p: Page, name: string) =>
  p
    .locator('section[aria-labelledby^="payments-"] li')
    .filter({ hasText: name })
    .filter({ visible: true })
    .first();

/** The client approves what's on screen, signing with name and email. */
async function approve(c: Page, buttonName: string) {
  await c
    .getByRole("button", { name: /^Approve/ })
    .filter({ visible: true })
    .first()
    .click();
  await label(c, "Your full name").fill("Rahul Mehta");
  await label(c, "Your email").fill("rahul@mehta.in");
  await button(c, buttonName).click();
  await expect(c.getByText(/Approved by Rahul Mehta/).first()).toBeVisible();
}
