import { describe, expect, it } from "vitest";
import { authErrorMessage } from "./auth-flow";

describe("authErrorMessage", () => {
  it("maps known codes", () => {
    expect(authErrorMessage({ code: "INVALID_EMAIL_OR_PASSWORD" })).toMatch(
      /don't match/,
    );
    expect(authErrorMessage({ code: "INVALID_OTP" })).toMatch(
      /code isn't right/,
    );
    expect(
      authErrorMessage({ code: "TOO_MANY_ATTEMPTS", status: 403 }),
    ).toMatch(/Send a new one/);
  });

  it("treats 429 as rate limiting", () => {
    expect(authErrorMessage({ status: 429 })).toMatch(/Too many attempts/);
  });

  it("has a generic fallback", () => {
    expect(authErrorMessage({ code: "SOMETHING_NEW" })).toMatch(
      /Something went wrong/,
    );
    expect(authErrorMessage(null)).toMatch(/Something went wrong/);
  });
});
