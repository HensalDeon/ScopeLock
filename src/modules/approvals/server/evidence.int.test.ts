import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { collection } from "@/shared/db/collections";
import { withTransaction } from "@/shared/db/transaction";
import { hashSnapshot } from "@/shared/lib/hash";
import { approvalSignatureValid } from "./evidence";
import { recordDecision } from "./record";
import { findApprovalsForProject, type ApprovalDoc } from "./repository";

const snapshot = {
  title: "Website redesign",
  currency: "INR",
  total: 8_000_000,
  issuedOn: new Date("2026-11-06T10:00:00Z"),
  validUntil: null,
};

describe("approval evidence", () => {
  it("stores a hashed, signed record that detects tampering", async () => {
    const ws = "ws_evidence";
    const projectId = new ObjectId();
    await withTransaction((session) =>
      recordDecision(
        {
          workspaceId: ws,
          projectId,
          subject: { type: "baseline", id: projectId.toHexString() },
          decision: {
            decision: "approved",
            name: "Rahul Mehta",
            email: "rahul@mehta.in",
            comment: null,
          },
          decidedAt: new Date(),
          snapshot,
          ip: "203.0.113.7",
          userAgent: "Mozilla/5.0",
        },
        session,
      ),
    );

    const [doc] = await findApprovalsForProject(ws, projectId);
    if (!doc) throw new Error("no record");
    expect(doc.snapshotHash).toBe(hashSnapshot(snapshot));
    expect(hashSnapshot(doc.snapshot)).toBe(doc.snapshotHash);
    expect(approvalSignatureValid(doc)).toBe(true);
    expect(doc.workspaceId).toBe(ws);

    // Someone with database access edits the snapshot and re-hashes it…
    const edited = { ...doc.snapshot, total: 5_000_000 };
    await collection<ApprovalDoc>("approvals").updateOne(
      { _id: doc._id },
      { $set: { snapshot: edited, snapshotHash: hashSnapshot(edited) } },
    );
    const [tampered] = await findApprovalsForProject(ws, projectId);
    if (!tampered) throw new Error("no record");
    // …the hash matches again, but the signature (key not in the DB) doesn't.
    expect(hashSnapshot(tampered.snapshot)).toBe(tampered.snapshotHash);
    expect(approvalSignatureValid(tampered)).toBe(false);

    // Changing who decided breaks it too.
    expect(
      approvalSignatureValid({
        ...doc,
        decidedBy: { ...doc.decidedBy, name: "Someone else" },
      }),
    ).toBe(false);
  });
});
