import { expect, test } from "./fixtures";
import { setPlanAsAdmin } from "./admin";
import { button, label, linkFor, newEmail, signUpFreelancer } from "./helpers";

/**
 * Agency teams: the owner invites a member by email; they make an account
 * from the link, confirm their email and join; members can't change
 * settings; a smaller plan pauses them; the owner removes them.
 */
test("an agency invites a member, who joins from the email", async ({
  page: owner,
  browser,
}) => {
  const { email: ownerEmail } = await signUpFreelancer(owner, {
    email: newEmail("agency"),
    business: "Asha Designs",
  });
  await setPlanAsAdmin(browser, ownerEmail, "Agency");

  // The owner invites Priya as a member.
  const priya = newEmail("priya");
  await owner.goto("/settings/team");
  await expect(owner.getByText(/1 of 5 places used on Agency/)).toBeVisible();
  await label(owner, "Their email", true).fill(priya);
  await button(owner, "Send invite").click();
  await expect(
    owner.getByText(`Invite sent to ${priya}.`, { exact: false }),
  ).toBeVisible();
  // The link can also go on WhatsApp.
  await expect(button(owner, "Copy invite link")).toBeVisible();
  await expect(owner.getByText(/Invited as member/)).toBeVisible();

  // Priya opens the emailed link, makes an account, confirms, joins.
  const ctx = await browser.newContext({
    extraHTTPHeaders: { "x-e2e-client-ip": `10.251.${Date.now() % 250}.2` },
  });
  const m = await ctx.newPage();
  await m.goto(await linkFor(priya, "/invite/"));
  await expect(
    m.getByRole("heading", { name: "Join Asha Designs on ScopeLock" }),
  ).toBeVisible();
  await m.getByRole("link", { name: "Create your account" }).click();
  await label(m, "Your name").fill("Priya Nair");
  await expect(label(m, "Email", true)).toHaveValue(priya);
  await label(m, "Password", true).fill("e2e-password-123");
  await button(m, "Create account").click();
  // Back on the invite; opening the emailed link confirmed the email.
  await m.waitForURL(/\/invite\//);
  await button(m, "Join Asha Designs").click();
  await m.waitForURL(/\/dashboard/);
  // Opening the emailed link confirmed her email: no code to enter.
  await expect(m.getByText(/Confirm your email so/)).toHaveCount(0);

  // A member sees the settings but can't change them.
  await m.goto("/settings");
  await expect(m.getByText(/You're a member of this workspace/)).toBeVisible();
  await m.goto("/settings/team");
  await expect(m.getByText("Priya Nair").first()).toBeVisible();
  await expect(button(m, "Send invite")).toHaveCount(0);

  // The owner sees her; a smaller plan pauses her access.
  await owner.reload();
  await expect(owner.getByText("Priya Nair").first()).toBeVisible();
  await setPlanAsAdmin(browser, ownerEmail, "Free");
  await m.goto("/dashboard");
  await m.waitForURL(/\/team-access/);
  await expect(
    m.getByRole("heading", { name: /Asha Designs isn't open to you/ }),
  ).toBeVisible();

  // Back on Agency she's in again; then the owner removes her.
  await setPlanAsAdmin(browser, ownerEmail, "Agency");
  await m.goto("/dashboard");
  await expect(m).toHaveURL(/\/dashboard/);
  await owner.goto("/settings/team");
  await button(owner, "Remove Priya Nair").click();
  await button(owner, "Remove Priya").click();
  await expect(
    owner.getByRole("listitem").filter({ hasText: "Priya Nair" }),
  ).toHaveCount(0);
  await m.goto("/dashboard");
  await m.waitForURL(/\/onboarding/);
  await ctx.close();
});
