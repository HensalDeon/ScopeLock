import { describe, expect, it } from "vitest";
import { minor } from "@/shared/lib/money";
import { amountInWords } from "./words";

describe("amountInWords", () => {
  it("writes rupees the Indian way", () => {
    expect(amountInWords(minor(2_832_000), "INR")).toBe(
      "Rupees twenty-eight thousand three hundred and twenty only",
    );
    expect(amountInWords(minor(1_25_00_000_00), "INR")).toBe(
      "Rupees one crore twenty-five lakh only",
    );
    expect(amountInWords(minor(9_440_050), "INR")).toBe(
      "Rupees ninety-four thousand four hundred and fifty paise only",
    );
  });
  it("uses thousands and millions for other currencies", () => {
    expect(amountInWords(minor(1_200_050), "USD")).toBe(
      "US dollars twelve thousand and fifty cents only",
    );
  });
});
