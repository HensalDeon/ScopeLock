import { describe, expect, it } from "vitest";
import { renderEmail } from "./layout";
import { codeEmail } from "./templates";

describe("codeEmail", () => {
  it("puts the code in the subject and the body", () => {
    const { subject, content } = codeEmail("forget-password", "482913");
    expect(subject).toBe("482913 is your ScopeLock password reset code");
    const { html, text } = renderEmail(content, "https://scopelock.in");
    expect(html).toContain("482913");
    expect(text).toContain("482913");
    expect(text).toContain("10 minutes");
  });

  it("words the verification email for confirming an address", () => {
    const { subject, content } = codeEmail("email-verification", "000123");
    expect(subject).toBe("000123 is your ScopeLock confirmation code");
    expect(content.heading).toBe("Confirm your email");
  });
});
