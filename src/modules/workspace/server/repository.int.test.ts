import { describe, expect, it } from "vitest";
import { getWorkspaceProfile, saveWorkspaceProfile } from "./repository";

describe("workspace profile repository", () => {
  it("creates, reads and updates a profile per workspace", async () => {
    expect(await getWorkspaceProfile("ws_1")).toBeNull();

    await saveWorkspaceProfile("ws_1", {
      businessName: "Pixel & Code Studio",
      businessType: "studio",
      phone: "+919876543210",
    });
    const created = await getWorkspaceProfile("ws_1");
    expect(created).toMatchObject({
      workspaceId: "ws_1",
      businessName: "Pixel & Code Studio",
      currency: "INR",
    });

    await saveWorkspaceProfile("ws_1", {
      businessName: "Pixel and Code",
      businessType: "agency",
      phone: null,
    });
    const updated = await getWorkspaceProfile("ws_1");
    expect(updated).toMatchObject({
      businessName: "Pixel and Code",
      phone: null,
    });
    expect(updated?.createdAt).toEqual(created?.createdAt);
    expect(await getWorkspaceProfile("ws_2")).toBeNull();
  });
});
