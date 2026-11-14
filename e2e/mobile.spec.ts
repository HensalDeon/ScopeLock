import { devices, expect, test } from "./fixtures";
import { newEmail, signUpFreelancer } from "./helpers";

test.use({ ...devices["Pixel 7"] });

/** Phone menu: coming back to the page it was opened on doesn't reopen it. */
test("the phone menu stays shut after going back with the logo", async ({
  page: p,
}) => {
  await signUpFreelancer(p, { email: newEmail("mobile") });
  await p.goto("/dashboard");
  await p.getByRole("button", { name: "Open menu" }).click();
  const menu = p.getByRole("dialog");
  await expect(menu).toBeVisible();
  await menu.getByRole("link", { name: "Settings" }).click();
  await p.waitForURL(/\/settings$/);
  await expect(menu).toBeHidden();
  await p.getByRole("link", { name: "Overview" }).first().click();
  await p.waitForURL(/\/dashboard$/);
  await expect(p.getByRole("dialog")).toBeHidden();
});

/** The installed app opens into Overview, with an iPhone start-up screen. */
test("the installed app starts in the app, with a start-up screen", async ({
  request,
}) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.start_url).toBe("/dashboard");
  const splash = await request.get("/splash?w=1170&h=2532");
  expect(splash.status()).toBe(200);
  expect(splash.headers()["content-type"]).toBe("image/png");
  expect((await request.get("/splash?w=10&h=10")).status()).toBe(404);
});
