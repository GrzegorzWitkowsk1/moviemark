import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addMovieToCollection,
  getMovieCollectionStatus,
  loginUser,
  logoutUser,
  registerUser,
} from "./api";
import {
  clearAccessToken,
  setAccessToken,
  getAccessToken,
} from "./token";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  clearAccessToken();
  vi.unstubAllGlobals();
});

describe("api fetch", () => {
  it("returns parsed JSON on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ watched: false }))
    );

    await expect(getMovieCollectionStatus(550)).resolves.toEqual({
      watched: false,
    });
  });

  it("returns null on 204", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    const result = await getMovieCollectionStatus(550);
    expect(result).toBeNull();
  });

  it("translates error.* codes to localized messages", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ error: "error.auth.login.invalidCredentials" }, 401)
      )
    );

    await expect(getMovieCollectionStatus(550)).rejects.toThrow(
      "Invalid email or password"
    );
  });

  it("passes through non error.* codes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ error: "some.raw.code" }, 400))
    );

    await expect(getMovieCollectionStatus(550)).rejects.toThrow("some.raw.code");
  });

  it("falls back to error.generic for unknown bodies", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ nope: true }, 500))
    );

    await expect(getMovieCollectionStatus(550)).rejects.toThrow(
      "Something went wrong. Please try again."
    );
  });

  it("throws a network error when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("boom")));

    await expect(getMovieCollectionStatus(550)).rejects.toThrow(
      "Network error. Please try again later."
    );
  });
});

describe("401 refresh flow", () => {
  it("retries once with a fresh token when an expired token returns 401", async () => {
    setAccessToken("expired-token");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: "error.unauthorized" }, 401))
      .mockResolvedValueOnce(
        jsonResponse({ accessToken: "new-token" }, 200)
      )
      .mockResolvedValueOnce(jsonResponse({ watched: true }, 200));

    vi.stubGlobal("fetch", fetchMock);

    await expect(getMovieCollectionStatus(550)).resolves.toEqual({
      watched: true,
    });
    expect(getAccessToken()).toBe("new-token");

    const calls = fetchMock.mock.calls as [string, RequestInit][];
    expect(calls[0][0]).toContain("/collection/movie/550");
    expect((calls[0][1].headers as Record<string, string>).Authorization).toBe(
      "Bearer expired-token"
    );
    expect(calls[1][0]).toContain("/auth/refresh");
    expect((calls[2][1].headers as Record<string, string>).Authorization).toBe(
      "Bearer new-token"
    );
  });

  it("clears the token and surfaces the error when refresh fails", async () => {
    setAccessToken("expired-token");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: "error.unauthorized" }, 401))
      .mockResolvedValueOnce(jsonResponse({ error: "error.unauthorized" }, 401));

    vi.stubGlobal("fetch", fetchMock);

    await expect(getMovieCollectionStatus(550)).rejects.toThrow(
      "Unauthorized"
    );
    expect(getAccessToken()).toBeNull();
  });
});

describe("register and login", () => {
  it("registers without an Authorization header or refresh retry", async () => {
    setAccessToken("existing-token");
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ message: "Registration successful" }, 201)
    );
    vi.stubGlobal("fetch", fetchMock);

    await registerUser({
      name: "Anna",
      surname: "Kowalska",
      email: "a@test.com",
      password: "Password123",
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/auth/register");
    expect(init.method).toBe("POST");
    expect(init.headers).not.toHaveProperty("Authorization");
  });

  it("logs in and returns the parsed payload", async () => {
    const payload = {
      user: { id: "1", name: "Anna", email: "a@test.com" },
      accessToken: "token",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(payload, 200))
    );

    await expect(
      loginUser({ email: "a@test.com", password: "Password123" })
    ).resolves.toEqual(payload);
  });
});

describe("logout", () => {
  it("clears the token even when the request fails", async () => {
    setAccessToken("token");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("boom")));

    await expect(logoutUser()).rejects.toThrow(
      "Network error. Please try again later."
    );
    expect(getAccessToken()).toBeNull();
  });

  it("posts to /auth/logout and clears the token", async () => {
    setAccessToken("token");
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ message: "Logged out" }, 200)
    );
    vi.stubGlobal("fetch", fetchMock);

    await logoutUser();
    expect(getAccessToken()).toBeNull();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/auth/logout");
    expect(init.method).toBe("POST");
  });
});

describe("request shaping", () => {
  it("sends a JSON body and content-type for mutations", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ watched: true }, 200))
    );

    await addMovieToCollection({
      tmdbId: 550,
      title: "Fight Club",
      posterPath: null,
      rating: 8.4,
    });

    const [, init] = vi.mocked(fetch).mock.calls[0] as [
      string,
      RequestInit
    ];
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json"
    );
    expect(init.body).toContain('"tmdbId":550');
  });
});