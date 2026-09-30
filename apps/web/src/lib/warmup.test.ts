import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MAX_WAIT_MS, waitForApi } from "./warmup";

function ok() {
  return { ok: true, status: 200 } as Response;
}

function status(code: number) {
  return { ok: false, status: code } as Response;
}

describe("waitForApi", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("resolves ready on the first successful probe", async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok());
    vi.stubGlobal("fetch", fetchMock);

    await expect(waitForApi()).resolves.toBe("ready");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("requests the unauthenticated health endpoint without credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok());
    vi.stubGlobal("fetch", fetchMock);

    await waitForApi();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:3000/health");
    expect(init.credentials).toBeUndefined();
    expect(init.cache).toBe("no-store");
    expect(init.headers).toBeUndefined();
  });

  it("keeps polling through 502s and resolves once the server is up", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(status(502))
      .mockResolvedValueOnce(status(503))
      .mockResolvedValueOnce(status(502))
      .mockResolvedValueOnce(ok());
    vi.stubGlobal("fetch", fetchMock);

    const pending = waitForApi();

    await vi.runAllTimersAsync();

    await expect(pending).resolves.toBe("ready");
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("treats a thrown network error as still booting", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(ok());
    vi.stubGlobal("fetch", fetchMock);

    const pending = waitForApi();
    await vi.runAllTimersAsync();

    await expect(pending).resolves.toBe("ready");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("gives up as unreachable once the deadline passes", async () => {
    const fetchMock = vi.fn().mockResolvedValue(status(502));
    vi.stubGlobal("fetch", fetchMock);

    const pending = waitForApi();

    await vi.advanceTimersByTimeAsync(MAX_WAIT_MS + 5_000);

    await expect(pending).resolves.toBe("unreachable");
    expect(fetchMock.mock.calls.length).toBeGreaterThan(1);
  });

  it("resolves unreachable when aborted mid-poll", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(status(502)));

    const controller = new AbortController();
    const pending = waitForApi({ signal: controller.signal });

    await vi.advanceTimersByTimeAsync(2_000);
    controller.abort();

    await expect(pending).resolves.toBe("unreachable");
  });

  it("resolves unreachable immediately for an already aborted signal", async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok());
    vi.stubGlobal("fetch", fetchMock);

    const controller = new AbortController();
    controller.abort();

    await expect(waitForApi({ signal: controller.signal })).resolves.toBe(
      "unreachable"
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("gives up quickly when given a short deadline", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(status(502)));

    const pending = waitForApi({ maxWaitMs: 4_000 });

    await vi.advanceTimersByTimeAsync(6_000);

    await expect(pending).resolves.toBe("unreachable");
  });
});
