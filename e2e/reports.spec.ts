import { expect, test } from "./fixtures";
import { newEmail, signUpFreelancer } from "./helpers";

/** Reports are on Agency: Free sees what they are, and no CSV. */
test("revenue recovered reports wait for the Agency plan", async ({
  page: p,
}) => {
  await signUpFreelancer(p, { email: newEmail("reports") });
  await p
    .getByRole("link", { name: "Reports" })
    .filter({ visible: true })
    .click();
  await expect(
    p.getByRole("heading", { level: 1, name: "Revenue recovered" }),
  ).toBeVisible();
  await expect(
    p.getByText("No change requests approved in FY", { exact: false }),
  ).toBeVisible();
  await expect(
    p.getByRole("link", { name: "See the Agency plan" }),
  ).toBeVisible();
  // The CSV address sends them to the page that explains it, not a file.
  const csv = await p.request.get("/reports/export?year=2026", {
    maxRedirects: 0,
  });
  expect(csv.status()).toBe(303);
  expect(csv.headers().location).toMatch(/\/reports$/);
});
