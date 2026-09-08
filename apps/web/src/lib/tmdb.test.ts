import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n";
import { tmdbLanguage } from "./tmdb";

afterEach(async () => {
  await i18n.changeLanguage("en");
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("tmdbLanguage", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("maps English to en-US", () => {
    expect(tmdbLanguage()).toBe("en-US");
  });

  it("maps Polish to pl-PL", async () => {
    await i18n.changeLanguage("pl");
    expect(tmdbLanguage()).toBe("pl-PL");
  });

  it("falls back to en-US for unknown languages", async () => {
    await i18n.changeLanguage("de");
    expect(tmdbLanguage()).toBe("en-US");
  });
});

describe("tmdb fetch layer", () => {
  function jsonResponse(body: unknown) {
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  it("throws without a token", async () => {
    vi.stubEnv("VITE_TMDB_TOKEN", "");
    vi.resetModules();
    const tmdb = await import("./tmdb");
    await expect(tmdb.searchMulti("fight")).rejects.toThrow(
      "Missing VITE_TMDB_TOKEN."
    );
  });

  it("sends the api_key when the token is not a JWT", async () => {
    vi.stubEnv("VITE_TMDB_TOKEN", "plain-key");
    vi.resetModules();
    const tmdb = await import("./tmdb");

    const fetchSpy = vi.fn().mockResolvedValue(
      jsonResponse({ results: [] })
    );
    vi.stubGlobal("fetch", fetchSpy);

    await tmdb.searchMulti("fight club");

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/search/multi?query=fight%20club");
    expect(url).toContain("language=en-US");
    expect(url).toContain("api_key=plain-key");
    expect(init.headers).toEqual({});
  });

  it("sends a Bearer token and no api_key for a JWT", async () => {
    vi.stubEnv("VITE_TMDB_TOKEN", "eyJ.some.jwt");
    vi.resetModules();
    const tmdb = await import("./tmdb");

    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse({ results: [] }));
    vi.stubGlobal("fetch", fetchSpy);

    await tmdb.getMovieDetails(550);

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/movie/550?language=en-US");
    expect(url).not.toContain("api_key=");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer eyJ.some.jwt"
    );
  });

  it("uses the Polish language when the UI is in Polish", async () => {
    vi.stubEnv("VITE_TMDB_TOKEN", "plain-key");
    vi.resetModules();
    const tmdb = await import("./tmdb");

    await i18n.changeLanguage("pl");

    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse({ results: [] }));
    vi.stubGlobal("fetch", fetchSpy);

    await tmdb.getTrending("movie", "week");

    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/trending/movie/week?language=pl-PL");
  });

  it("honours an explicit language override for details", async () => {
    vi.stubEnv("VITE_TMDB_TOKEN", "plain-key");
    vi.resetModules();
    const tmdb = await import("./tmdb");

    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse({ id: 550 }));
    vi.stubGlobal("fetch", fetchSpy);

    await tmdb.getMovieDetails(550, "en-US");

    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("language=en-US");
  });
});