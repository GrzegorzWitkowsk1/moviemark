import { afterEach, describe, expect, it, vi } from "vitest";
import { sendGuestTeardownBeacon } from "./guestTeardown";
import { setAccessToken } from "./token";

const API = "http://localhost:3000";

describe("sendGuestTeardownBeacon", () => {
  afterEach(() => {
    setAccessToken(null);
    vi.restoreAllMocks();
  });

  it("posts the access token through sendBeacon", () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, "sendBeacon", {
      value: sendBeacon,
      configurable: true,
    });
    setAccessToken("guest-token");

    expect(sendGuestTeardownBeacon()).toBe(true);
    expect(sendBeacon).toHaveBeenCalledTimes(1);

    const [url, body] = sendBeacon.mock.calls[0] as unknown as [string, Blob];
    expect(url).toBe(`${API}/auth/guest/end`);
    expect(body).toBeInstanceOf(Blob);
  });

  it("falls back to keepalive fetch when sendBeacon is unavailable", () => {
    Object.defineProperty(navigator, "sendBeacon", {
      value: undefined,
      configurable: true,
    });
    setAccessToken("guest-token");
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    expect(sendGuestTeardownBeacon()).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe(`${API}/auth/guest/end`);
    expect(fetchSpy.mock.calls[0][1]).toMatchObject({
      method: "POST",
      keepalive: true,
    });
  });

  it("does nothing without an access token", () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, "sendBeacon", {
      value: sendBeacon,
      configurable: true,
    });

    expect(sendGuestTeardownBeacon()).toBe(false);
    expect(sendBeacon).not.toHaveBeenCalled();
  });
});