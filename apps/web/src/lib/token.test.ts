import { beforeEach, describe, expect, it } from "vitest";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "./token";

beforeEach(() => {
  clearAccessToken();
});

describe("token store", () => {
  it("starts empty", () => {
    expect(getAccessToken()).toBeNull();
  });

  it("stores and reads a token", () => {
    setAccessToken("token-1");
    expect(getAccessToken()).toBe("token-1");
  });

  it("clears the token", () => {
    setAccessToken("token-1");
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });

  it("accepts null to clear", () => {
    setAccessToken("token-1");
    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
  });
});