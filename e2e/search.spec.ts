import { expect, test, type Page } from "./fixtures";
import { button, label, newEmail, signUpFreelancer } from "./helpers";

/** List search updates the list in place: no full page reload. */
test("searching clients doesn't reload the page", async ({ page: p }) => {
  await signUpFreelancer(p, { email: newEmail("search") });
  for (const name of ["Rahul Mehta", "Priya Nair"]) {
    await p.goto("/clients/new");
    await label(p, "Client name").fill(name);
    await button(p, "Add client", true).click();
    await p.waitForURL(/\/clients\/[0-9a-f]{24}$/);
  }

  await p.goto("/clients");
  const list = p.locator("main");
  await expect(list.getByText("Priya Nair").first()).toBeVisible();
  // Survives client-side navigation, gone after a full reload.
  await p.evaluate(() => ((window as { kept?: boolean }).kept = true));
  const kept = () =>
    p.evaluate(() => (window as { kept?: boolean }).kept === true);

  // An empty search does nothing at all.
  await button(p, "Search", true).click();
  await expect(p).toHaveURL(/\/clients$/);

  await label(p, "Search clients").fill("  mehta ");
  await label(p, "Search clients").press("Enter");
  await expect(p).toHaveURL(/\/clients\?q=mehta$/);
  await expect(list.getByText("Rahul Mehta").first()).toBeVisible();
  await expect(list.getByText("Priya Nair").first()).toBeHidden();

  // Emptying the box clears the search; so does Clear.
  await label(p, "Search clients").fill("");
  await button(p, "Search", true).click();
  await expect(p).toHaveURL(/\/clients$/);
  await expect(list.getByText("Priya Nair").first()).toBeVisible();

  await search(p, "nair");
  await p.getByRole("link", { name: "Clear" }).click();
  await expect(p).toHaveURL(/\/clients$/);
  await expect(label(p, "Search clients")).toHaveValue("");

  expect(await kept()).toBe(true);
});

async function search(p: Page, term: string) {
  await label(p, "Search clients").fill(term);
  await button(p, "Search", true).click();
  await expect(p).toHaveURL(new RegExp(`\\?q=${term}$`));
}
