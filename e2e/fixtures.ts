import { test as base } from "@playwright/test";

export { devices, expect, type Page } from "@playwright/test";

let visitor = 0;

/**
 * Each test is a different visitor. The e2e server reads the visitor's IP
 * from this header (CLIENT_IP_HEADER in e2e/serve.mjs), so the per-IP
 * sign-up and sign-in limits stay fully on, as in production, without one
 * test's sign-ups counting against the next.
 */
export const test = base.extend({
  context: async ({ context }, provide, info) => {
    visitor += 1;
    await context.setExtraHTTPHeaders({
      "x-e2e-client-ip": `10.${info.workerIndex}.${visitor >> 8}.${visitor & 255}`,
    });
    await provide(context);
  },
});
