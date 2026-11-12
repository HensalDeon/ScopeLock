import { expect, test } from "./fixtures";
import { button, label } from "./helpers";

test("sign-up says which field is wrong", async ({ page }) => {
  await page.goto("/sign-up");
  await button(page, "Create account").click();
  await expect(
    page.getByText("Add your name, as your clients know you."),
  ).toBeVisible();
  await expect(page.getByText("Add your email address.")).toBeVisible();
  await expect(label(page, "Your name")).toBeFocused();

  await label(page, "Your name").fill("Asha Menon");
  await label(page, "Email", true).fill("asha@");
  await label(page, "Password", true).fill("long-enough-1");
  await button(page, "Create account").click();
  await expect(
    page.getByText("That doesn't look like an email address."),
  ).toBeVisible();
});

test("a wrong password is said plainly", async ({ page }) => {
  await page.goto("/sign-in");
  await label(page, "Email", true).fill("nobody@scopelock.test");
  await label(page, "Password", true).fill("not-the-password");
  await button(page, "Sign in").click();
  await expect(page.getByRole("alert").first()).toBeVisible();
  await expect(page).toHaveURL(/\/sign-in/);
});

test("resetting a password: the code step has its own heading", async ({
  page,
}) => {
  await page.goto("/forgot-password");
  await expect(
    page.getByRole("heading", { name: "Reset your password" }),
  ).toBeVisible();
  await label(page, "Email", true).fill("nobody@scopelock.test");
  await button(page, /code/i).first().click();
  await expect(
    page.getByRole("heading", { name: "Check your email" }),
  ).toBeVisible();
});
