import { describe, expect, it } from "vitest";
import { minor } from "@/shared/lib/money";
import { gstOver, withGst } from "./gst";

describe("document GST figures", () => {
  it("adds GST per payment and in total", () => {
    const payments = [2_880_000, 2_880_000, 3_840_000].map(minor);
    expect(gstOver(payments, 18)).toEqual({
      tax: 1_728_000,
      total: 11_328_000,
    });
    expect(withGst(minor(1_500_000), 18)).toBe(1_770_000);
  });

  it("no rate (older documents, or no GST): nothing to show", () => {
    expect(gstOver([minor(100)], null)).toBeNull();
    expect(withGst(minor(100), undefined)).toBeNull();
  });
});
