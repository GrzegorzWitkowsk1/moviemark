import { describe, expect, it } from "bun:test";
import { refreshCookieAttributes } from "../src/plugins/auth";

describe("refreshCookieAttributes", () => {
  it("uses SameSite=None + Secure in production", () => {
    const attrs = refreshCookieAttributes(false, true);
    expect(attrs.sameSite).toBe("none");
    expect(attrs.secure).toBe(true);
  });

  it("uses SameSite=Lax and no Secure outside production", () => {
    const attrs = refreshCookieAttributes(false, false);
    expect(attrs.sameSite).toBe("lax");
    expect(attrs.secure).toBe(false);
  });

  it("keeps httpOnly and root path in both environments", () => {
    for (const isProduction of [true, false]) {
      const attrs = refreshCookieAttributes(false, isProduction);
      expect(attrs.httpOnly).toBe(true);
      expect(attrs.path).toBe("/");
    }
  });

  it("sets a 7-day maxAge when remember is true", () => {
    expect(refreshCookieAttributes(true, true).maxAge).toBe(60 * 60 * 24 * 7);
  });

  it("sets a 1-day maxAge when remember is false", () => {
    expect(refreshCookieAttributes(false, false).maxAge).toBe(60 * 60 * 24);
  });
});