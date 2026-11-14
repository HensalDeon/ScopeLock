import { expect, test } from "./fixtures";

const SECRET = "e2e-cron-secret-0123456789abcdef0123456789";

/** The daily reminder run answers only to the scheduler's secret. */
test("the reminder run needs the cron secret", async ({ request }) => {
  const url = "/api/cron/reminders";
  expect((await request.get(url)).status()).toBe(401);
  expect(
    (
      await request.get(url, {
        headers: { authorization: "Bearer not-the-secret" },
      })
    ).status(),
  ).toBe(401);
  const ok = await request.get(url, {
    headers: { authorization: `Bearer ${SECRET}` },
  });
  expect(ok.status()).toBe(200);
  const run = await ok.json();
  expect(typeof run.outsideHours).toBe("boolean");
  expect(run.failed).toBe(0);
});
