import { afterEach, describe, expect, it } from "vitest";
import { HttpResponse, http } from "msw";
import i18n from "@/i18n";
import {
  getMovieDetails,
  getTrending,
  searchMulti,
  tmdbLanguage,
} from "./tmdb";
import { server } from "@/test/server";
import { TMDB_BASE } from "@/test/handlers/tmdbHandlers";
import { clearAccessToken, setAccessToken } from "./token";

afterEach(async () => {
  clearAccessToken();
  await i18n.changeLanguage("en");
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
  it("requests the authenticated proxy endpoint with the query and language", async () => {
    setAccessToken("test-access-token");

    let captured: { url: string; auth: string | null } | undefined;
    server.use(
      http.get(`${TMDB_BASE}/search/multi`, ({ request }) => {
        captured = {
          url: request.url,
          auth: request.headers.get("authorization"),
        };
        return HttpResponse.json({ results: [] });
      })
    );

    await searchMulti("fight club");

    expect(captured?.url).toContain("/tmdb/search/multi?query=fight%20club");
    expect(captured?.url).toContain("language=en-US");
    expect(captured?.auth).toBe("Bearer test-access-token");
  });

  it("uses the Polish language when the UI is in Polish", async () => {
    await i18n.changeLanguage("pl");

    let capturedUrl = "";
    server.use(
      http.get(`${TMDB_BASE}/trending/movie/week`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ results: [] });
      })
    );

    await getTrending("movie", "week");

    expect(capturedUrl).toContain("/tmdb/trending/movie/week?language=pl-PL");
  });

  it("honours an explicit language override for details", async () => {
    await i18n.changeLanguage("pl");

    let capturedUrl = "";
    server.use(
      http.get(`${TMDB_BASE}/movie/550`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ id: 550 });
      })
    );

    await getMovieDetails(550, "en-US");

    expect(capturedUrl).toContain("language=en-US");
  });

  it("refreshes the access token and retries once on a 401", async () => {
    setAccessToken("expired-token");
    let attempts = 0;
    let capturedAuth: string | null = null;

    server.use(
      http.post("http://localhost:3000/auth/refresh", () =>
        HttpResponse.json({ accessToken: "refreshed-token" })
      ),
      http.get(`${TMDB_BASE}/search/multi`, ({ request }) => {
        attempts += 1;
        capturedAuth = request.headers.get("authorization");
        if (attempts === 1) {
          return HttpResponse.json({ error: "error.unauthorized" }, { status: 401 });
        }
        return HttpResponse.json({ results: [] });
      })
    );

    await expect(searchMulti("fight club")).resolves.toEqual({ results: [] });

    expect(attempts).toBe(2);
    expect(capturedAuth).toBe("Bearer refreshed-token");
  });
});