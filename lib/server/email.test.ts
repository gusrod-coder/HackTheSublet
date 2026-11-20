import { afterEach, describe, expect, it } from "vitest";
import { skipReason } from "./email";

describe("email safety: which addresses get real mail", () => {
  afterEach(() => delete process.env.EMAIL_ALLOW);

  it("never sends to sample addresses", () => {
    expect(skipReason("priya@example.edu")).toBe("sample address");
    expect(skipReason("x@sub.example.com")).toBe("sample address");
  });
  it("allows real addresses when no allowlist is set", () => {
    expect(skipReason("someone@umich.edu")).toBeNull();
  });
  it("respects EMAIL_ALLOW domains and exact addresses", () => {
    process.env.EMAIL_ALLOW = "umich.edu, friend@gmail.com";
    expect(skipReason("a@umich.edu")).toBeNull();
    expect(skipReason("a@med.umich.edu")).toBeNull();
    expect(skipReason("friend@gmail.com")).toBeNull();
    expect(skipReason("stranger@gmail.com")).toBe("not in EMAIL_ALLOW");
  });
});
