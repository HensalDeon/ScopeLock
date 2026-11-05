import { describe, expect, it } from "vitest";
import { fieldErrorsFrom, readFields, UserError } from "./form-state";

describe("readFields", () => {
  it("reads only the listed text fields", () => {
    const form = new FormData();
    form.set("name", "Rahul Mehta");
    form.set("$ACTION_ID_abc", "x");
    form.set("upload", new Blob(["x"]), "proof.png");
    expect(readFields(form, ["name", "email", "upload"] as const)).toEqual({
      name: "Rahul Mehta",
      email: "",
      upload: "",
    });
  });
});

describe("fieldErrorsFrom", () => {
  it("keeps the first message per top-level field", () => {
    expect(
      fieldErrorsFrom([
        { path: ["name"], message: "Too short" },
        { path: ["name"], message: "Second" },
        { path: ["items", 0, "title"], message: "Required" },
        { path: [], message: "Form-level" },
      ]),
    ).toEqual({
      name: "Too short",
      items: "Required",
      "items.0.title": "Required",
    });
  });
});

describe("UserError", () => {
  it("is an Error with a recognisable name", () => {
    const error = new UserError("A client with this email already exists.");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("UserError");
  });
});
