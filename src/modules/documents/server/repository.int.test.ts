import { describe, expect, it } from "vitest";
import { STARTER_PROPOSAL_DEFAULTS } from "../domain/defaults";
import { DEFAULT_DOCUMENT_STYLE } from "../domain/style";
import * as repo from "./repository";

describe("document settings repository", () => {
  it("falls back to defaults until something is saved", async () => {
    expect(await repo.findDocumentSettings("ws_new")).toEqual({
      style: DEFAULT_DOCUMENT_STYLE,
      defaults: STARTER_PROPOSAL_DEFAULTS,
      images: { logoKey: null, coverKey: null },
    });
  });

  it("saves style and defaults independently, per workspace", async () => {
    const style = {
      ...DEFAULT_DOCUMENT_STYLE,
      accent: "#4f46e5" as const,
      cover: "light" as const,
    };
    await repo.saveDocumentStyle("ws_a", style);
    expect((await repo.findDocumentSettings("ws_a")).style).toEqual(style);
    expect((await repo.findDocumentSettings("ws_a")).defaults).toEqual(
      STARTER_PROPOSAL_DEFAULTS,
    );

    const defaults = {
      terms: ["Valid 7 days"],
      exclusions: [],
      clientProvides: ["Logo"],
    };
    await repo.saveProposalDefaults("ws_a", defaults);
    const both = await repo.findDocumentSettings("ws_a");
    expect(both.style).toEqual(style);
    expect(both.defaults).toEqual(defaults);

    expect((await repo.findDocumentSettings("ws_b")).style).toEqual(
      DEFAULT_DOCUMENT_STYLE,
    );
  });

  it("swaps image keys and hands back the old one for deletion", async () => {
    const ws = "ws_images";
    expect(
      await repo.setDocumentImage(ws, "logo", "ws/ws_images/logo/a.webp"),
    ).toBeNull();
    expect(
      await repo.setDocumentImage(ws, "logo", "ws/ws_images/logo/b.webp"),
    ).toBe("ws/ws_images/logo/a.webp");
    await repo.setDocumentImage(ws, "cover", "ws/ws_images/cover/c.jpg");
    expect((await repo.findDocumentSettings(ws)).images).toEqual({
      logoKey: "ws/ws_images/logo/b.webp",
      coverKey: "ws/ws_images/cover/c.jpg",
    });
    expect(await repo.setDocumentImage(ws, "logo", null)).toBe(
      "ws/ws_images/logo/b.webp",
    );
    expect((await repo.findDocumentSettings(ws)).images.logoKey).toBeNull();
    // Saving the style doesn't touch the images.
    await repo.saveDocumentStyle(ws, DEFAULT_DOCUMENT_STYLE);
    expect((await repo.findDocumentSettings(ws)).images.coverKey).toBe(
      "ws/ws_images/cover/c.jpg",
    );
  });
});
