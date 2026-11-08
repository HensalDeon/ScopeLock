import { ObjectId } from "mongodb";
import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/shared/db/client";
import { collection } from "@/shared/db/collections";
import { ensureIndexes } from "@/shared/db/indexes";
import { minor } from "@/shared/lib/money";
import * as repo from "./repository";
import * as settingsRepo from "./settings-repository";
import { refreshPaymentTotals } from "./totals";

beforeAll(async () => {
  await ensureIndexes(db());
});

const by = { userId: "u1", name: "Hensal Deon" };
const lines = [
  {
    kind: "baseline" as const,
    refId: "m3",
    description: "40% of the agreed ₹80,000",
    amount: minor(3_200_000),
  },
];

async function project(ws: string) {
  const _id = new ObjectId();
  await collection("projects").insertOne({
    _id,
    workspaceId: ws,
    status: "active",
    totals: {
      baseline: 8_000_000,
      approvedChanges: 0,
      pendingChanges: 0,
      paid: 0,
      due: 0,
    },
  });
  return _id;
}

const ask = (ws: string, projectId: ObjectId, key = "m3", amount = 3_200_000) =>
  repo.insertPayment(ws, {
    projectId,
    key,
    label: "Before launch",
    lines,
    amount,
    currency: "INR",
    by,
  });

const totals = async (id: ObjectId) =>
  (
    await collection<{ totals: { paid: number; due: number } }>(
      "projects",
    ).findOne({ _id: id })
  )?.totals;

describe("payments", () => {
  it("asks once per slot; cancelling frees the slot", async () => {
    const ws = "ws_pay_slots";
    const p = await project(ws);
    const first = await ask(ws, p);
    expect(first).toMatch(/^[0-9a-f]{24}$/);
    expect(await ask(ws, p)).toBeNull(); // double tap
    expect(
      await repo.cancelPayment(ws, new ObjectId(first!), {
        kind: "member",
        name: "H",
      }),
    ).toBe(true);
    expect(await ask(ws, p)).toMatch(/^[0-9a-f]{24}$/); // asked again
    const docs = await repo.findPaymentDocs(ws, p);
    expect(docs.map((d) => d.status)).toEqual(["cancelled", "due"]);
    expect(docs[0]?.open).toBeUndefined();
  });

  it("goes due → client says paid → not received → paid again → received, with totals", async () => {
    const ws = "ws_pay_flow";
    const p = await project(ws);
    const id = new ObjectId((await ask(ws, p, "m3", 4_700_000))!);
    await refreshPaymentTotals(ws, p);
    expect(await totals(p)).toMatchObject({ paid: 0, due: 4_700_000 });

    const report = {
      method: "upi" as const,
      reference: "431209876543",
      paidOn: "2026-11-07",
      note: null,
      proofKey: null,
      reportedAt: new Date(),
    };
    const client = { kind: "client" as const, name: "Rahul Mehta" };
    expect(await repo.reportPayment(ws, id, report, client)).toBe(true);
    expect(await repo.reportPayment(ws, id, report, client)).toBe(false); // not due any more

    expect(
      await repo.rejectReport(ws, id, "I can't see this UTR", {
        kind: "member",
        name: "H",
      }),
    ).toBe(true);
    const back = repo.toPayment((await repo.findPaymentDoc(ws, p, id))!);
    expect(back).toMatchObject({
      status: "due",
      lastRejection: { note: "I can't see this UTR" },
    });

    expect(
      await repo.reportPayment(
        ws,
        id,
        { ...report, reference: "431209876999" },
        client,
      ),
    ).toBe(true);
    expect(
      repo.toPayment((await repo.findPaymentDoc(ws, p, id))!).lastRejection,
    ).toBeNull();
    const confirmation = {
      method: "upi" as const,
      reference: "431209876999",
      receivedOn: "2026-11-07",
      confirmedAt: new Date(),
      by,
    };
    expect(await repo.confirmPayment(ws, id, confirmation)).toBe(true);
    expect(await repo.confirmPayment(ws, id, confirmation)).toBe(false);
    expect(
      await repo.cancelPayment(ws, id, { kind: "member", name: "H" }),
    ).toBe(false); // received: can't cancel

    await refreshPaymentTotals(ws, p);
    expect(await totals(p)).toMatchObject({ paid: 4_700_000, due: 0 });
    const doc = await repo.findPaymentDoc(ws, p, id);
    expect(doc?.history.map((h) => h.status)).toEqual([
      "due",
      "client_reported",
      "due",
      "client_reported",
      "confirmed",
    ]);
    expect(await repo.sumReceived(ws)).toEqual([
      { currency: "INR", total: 4_700_000 },
    ]);
    expect(await repo.findOwedPaymentDocs(ws)).toHaveLength(0);
  });

  it("keeps workspaces apart", async () => {
    const ws = "ws_pay_a";
    const p = await project(ws);
    const id = new ObjectId((await ask(ws, p))!);
    expect(await repo.findPaymentDoc("ws_pay_b", p, id)).toBeNull();
    expect(
      await repo.cancelPayment("ws_pay_b", id, { kind: "member", name: "X" }),
    ).toBe(false);
    expect(await repo.findProofKey("ws_pay_b", id)).toBeNull();
  });

  it("saves payment methods and swaps the QR image key", async () => {
    const ws = "ws_pay_methods";
    expect((await settingsRepo.findMethods(ws)).methods.upi).toBeNull();
    await settingsRepo.saveMethods(ws, {
      upi: { vpa: "asha@okhdfc", payeeName: "Asha" },
      bank: null,
      link: null,
      qr: { label: "Scan with GPay" },
      other: null,
      defaultMethod: "upi",
    });
    expect(
      await settingsRepo.setQrKey(ws, `ws/${ws}/payment-qr/a.png`),
    ).toBeNull();
    expect(await settingsRepo.setQrKey(ws, `ws/${ws}/payment-qr/b.png`)).toBe(
      `ws/${ws}/payment-qr/a.png`,
    );
    const { methods, qrKey } = await settingsRepo.findMethods(ws);
    expect(qrKey).toBe(`ws/${ws}/payment-qr/b.png`);
    expect(methods).toMatchObject({
      upi: { vpa: "asha@okhdfc" },
      qr: { label: "Scan with GPay", hasImage: true },
      defaultMethod: "upi",
    });
  });
});
