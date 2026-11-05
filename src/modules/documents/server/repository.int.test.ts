import { describe, expect, it } from "vitest";
import { STARTER_PROPOSAL_DEFAULTS } from "../domain/defaults";
import { DEFAULT_DOCUMENT_STYLE } from "../domain/style";
import * as repo from "./repository";

describe("document settings repository", () => {
  it("falls back to defaults until something is saved", async () => {
    expect(await repo.findDocumentSettings("ws_new")).toEqual({
      style: DEFAULT_DOCUMENT_STYLE,
      defaults: STARTER_PROPOSAL_DEFAULTS,
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
});
