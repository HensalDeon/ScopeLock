import { ObjectId } from "mongodb";
import { beforeAll, describe, expect, it } from "vitest";
import * as payments from "@/modules/payments/server/repository";
import { db } from "@/shared/db/client";
import { ensureIndexes } from "@/shared/db/indexes";
import { withTransaction } from "@/shared/db/transaction";
import { financialYear } from "@/shared/lib/india";
import { minor } from "@/shared/lib/money";
import { DEFAULT_INVOICING } from "../domain/invoice";
import { issueInvoice } from "./issue";
import * as repo from "./repository";

beforeAll(async () => {
  await ensureIndexes(db());
});

const fy = financialYear(new Date());
const buyer = {
  name: "Rahul Mehta",
  company: null,
  address: null,
  state: null,
  country: null,
  gstin: null,
  email: null,
};
const input = (settings = DEFAULT_INVOICING) => ({
  settings,
  business: { name: "Asha Studio", email: null },
  buyer,
  projectName: "Mehta Interiors website",
  paymentLabel: "Advance",
  lines: [{ description: "Advance", amount: minor(2_400_000) }],
  currency: "INR" as const,
  statement: null,
});

/** Issues an invoice and its payment in one transaction, like a real request. */
const request = (ws: string, projectId: ObjectId, key = "m1") =>
  withTransaction(async (session) => {
    const paymentId = new ObjectId();
    const issued = await issueInvoice(
      ws,
      { projectId, paymentId },
      input(await repo.findInvoicing(ws, session)),
      session,
    );
    const id = await payments.insertPayment(
      ws,
      {
        _id: paymentId,
        projectId,
        key,
        label: "Advance",
        lines: [],
        amount: 2_400_000,
        tax: issued.tax,
        invoice: { id: issued.id, number: issued.number },
        currency: "INR",
        by: { userId: "u1", name: "Asha" },
      },
      session,
    );
    if (!id) throw new Error("duplicate");
    return { ...issued, paymentId };
  });

describe("invoices", () => {
  it("numbers run in order per financial year, from the starting number", async () => {
    const ws = "ws_inv_numbers";
    const p = new ObjectId();
    expect((await request(ws, p, "a")).number).toBe(`INV/${fy.short}/001`);
    await repo.saveInvoicing(
      ws,
      { ...DEFAULT_INVOICING, prefix: "AS", startNumber: 40 },
      fy.key,
    );
    expect((await request(ws, p, "b")).number).toBe(`AS/${fy.short}/040`);
    // A lower starting number never moves the counter back.
    await repo.saveInvoicing(
      ws,
      { ...DEFAULT_INVOICING, prefix: "AS", startNumber: 2 },
      fy.key,
    );
    expect((await request(ws, p, "c")).number).toBe(`AS/${fy.short}/041`);
    expect(await repo.lastSerial(ws, fy.key)).toBe(41);
  });

  it("a double request rolls back: no invoice, no number used", async () => {
    const ws = "ws_inv_rollback";
    const p = new ObjectId();
    await request(ws, p);
    await expect(request(ws, p)).rejects.toThrow();
    expect(await repo.lastSerial(ws, fy.key)).toBe(1);
    expect(
      await db().collection("invoices").countDocuments({ workspaceId: ws }),
    ).toBe(1);
    expect((await request(ws, p, "m2")).number).toBe(`INV/${fy.short}/002`);
  });

  it("stores a frozen copy with its hash; status follows the payment; other workspaces can't read it", async () => {
    const ws = "ws_inv_status";
    const p = new ObjectId();
    const { id, paymentId } = await request(ws, p);
    const invoice = await repo.findInvoice(ws, id, p);
    expect(invoice).toMatchObject({
      status: "issued",
      title: "Invoice",
      total: 2_400_000,
    });
    expect(invoice?.snapshotHash).toMatch(/^[0-9a-f]{64}$/);
    expect(await repo.findInvoice(ws, id, new ObjectId())).toBeNull();
    expect(await repo.findInvoice("ws_other", id)).toBeNull();
    await repo.setInvoiceStatus(ws, paymentId, "cancelled");
    expect((await repo.findInvoice(ws, id))?.status).toBe("cancelled");
  });
});
