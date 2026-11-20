import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { emailLink, redirectFor, skipReason } from "./email";
import { safeNext } from "./session";

// Prisma (imported by ./email) loads the developer's .env; tests must not depend on it.
beforeEach(() => {
  delete process.env.EMAIL_ALLOW;
  delete process.env.EMAIL_REDIRECT;
});

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

describe("EMAIL_REDIRECT for demo personas", () => {
  afterEach(() => delete process.env.EMAIL_REDIRECT);
  it("is off unless set", () => {
    expect(redirectFor("priya@example.edu", "Priya")).toBeNull();
  });
  it("plus-addresses sample people into one real inbox", () => {
    process.env.EMAIL_REDIRECT = "team@gmail.com";
    expect(redirectFor("priya@example.edu", "Priya")).toBe("team+priya@gmail.com");
    expect(redirectFor("sam@example.edu")).toBe("team+sam@gmail.com");
  });
  it("never redirects real addresses", () => {
    process.env.EMAIL_REDIRECT = "team@gmail.com";
    expect(redirectFor("someone@umich.edu", "Someone")).toBeNull();
  });
});

describe("email links sign in as the recipient", () => {
  it("routes through /api/demo/login with the user and page", () => {
    expect(emailLink("/stayer/l_hill/form", "u_omar")).toMatch(/\/api\/demo\/login\?u=u_omar&next=%2Fstayer%2Fl_hill%2Fform$/);
  });
  it("only redirects to same-site paths", () => {
    expect(safeNext("/stayer/inbox")).toBe("/stayer/inbox");
    expect(safeNext("//evil.example")).toBe("/");
    expect(safeNext("https://evil.example")).toBe("/");
    expect(safeNext(null)).toBe("/");
  });
});
