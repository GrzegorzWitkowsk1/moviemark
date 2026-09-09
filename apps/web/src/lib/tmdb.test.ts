import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpResponse, http } from "msw";
import i18n from "@/i18n";
import { tmdbLanguage } from "./tmdb";
import { server } from "@/test/server";
import { TMDB_BASE } from "@/test/handlers/tmdbHandlers";

afterEach(async () => {
  await i18n.changeLanguage("en");
  vi.unstubAllEnvs();
});

describe("tmdbLanguage", () => {
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

    let captured: { url: string; body: string } | undefined;
    server.use(
      http.get(`${TMDB_BASE}/search/multi`, ({ request }) => {
        captured = {
          url: request.url,
          body: JSON.stringify(request.headers),
        };
        return HttpResponse.json({ results: [] });
      })
    );

    await tmdb.searchMulti("fight club");

    expect(captured?.url).toContain("/search/multi?query=fight%20club");
    expect(captured?.url).toContain("language=en-US");
    expect(captured?.url).toContain("api_key=plain-key");
    expect(captured?.body).toBe("{}");
  });

  it("sends a Bearer token and no api_key for a JWT", async () => {
    vi.stubEnv("VITE_TMDB_TOKEN", "eyJ.some.jwt");
    vi.resetModules();
    const tmdb = await import("./tmdb");

    let captured: { url: string; auth: string | null } | undefined;
    server.use(
      http.get(`${TMDB_BASE}/movie/550`, ({ request }) => {
        captured = {
          url: request.url,
          auth: request.headers.get("authorization"),
        };
        return HttpResponse.json({ id: 550 });
      })
    );

    await tmdb.getMovieDetails(550);

    expect(captured?.url).toContain("/movie/550?language=en-US");
    expect(captured?.url).not.toContain("api_key=");
    expect(captured?.auth).toBe("Bearer eyJ.some.jwt");
  });

  it("uses the Polish language when the UI is in Polish", async () => {
    vi.stubEnv("VITE_TMDB_TOKEN", "plain-key");
    vi.resetModules();
    const tmdb = await import("./tmdb");

    await i18n.changeLanguage("pl");

    let capturedUrl = "";
    server.use(
      http.get(`${TMDB_BASE}/trending/movie/week`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ results: [] });
      })
    );

    await tmdb.getTrending("movie", "week");

    expect(capturedUrl).toContain("/trending/movie/week?language=pl-PL");
  });

  it("honours an explicit language override for details", async () => {
    vi.stubEnv("VITE_TMDB_TOKEN", "plain-key");
    vi.resetModules();
    const tmdb = await import("./tmdb");

    let capturedUrl = "";
    server.use(
      http.get(`${TMDB_BASE}/movie/550`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ id: 550 });
      })
    );

    await tmdb.getMovieDetails(550, "en-US");

    expect(capturedUrl).toContain("language=en-US");
  });
});
