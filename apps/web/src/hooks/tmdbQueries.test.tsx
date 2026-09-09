import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { HttpResponse, http } from "msw";
import i18n from "@/i18n";
import { createTestQueryClient, renderHookWithProviders } from "@/test/utils";
import { server } from "@/test/server";
import { TMDB_BASE } from "@/test/handlers/tmdbHandlers";

const { useSearch } = await import("./useSearch");
const { useHomeContent } = await import("./useHomeContent/useHomeContent");
const { useMovieDetails } = await import("./useDetails/useDetails");
const { useTvSeason } = await import("./useDetails/useTvSeason");

const searchResults = { page: 1, results: [], total_pages: 0, total_results: 0 };

describe("useSearch", () => {
  it("debounces nothing at the hook level, keeps the query key bound to the language", async () => {
    let apiCalls = 0;
    server.use(
      http.get(`${TMDB_BASE}/search/multi`, () => {
        apiCalls += 1;
        return HttpResponse.json(searchResults);
      })
    );

    const { result, rerender } = renderHookWithProviders(
      ({ query }) => useSearch(query),
      { initialProps: { query: "fight" } }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiCalls).toBe(1);

    await act(async () => {
      await i18n.changeLanguage("pl");
    });
    await act(async () => {
      rerender({ query: "fight" });
    });

    await waitFor(() => expect(apiCalls).toBe(2));
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("filters out results without a poster", async () => {
    server.use(
      http.get(`${TMDB_BASE}/search/multi`, () =>
        HttpResponse.json({
          page: 1,
          total_results: 2,
          total_pages: 1,
          results: [
            { id: 1, media_type: "movie", title: "With poster", poster_path: "/a.jpg" },
            { id: 2, media_type: "movie", title: "No poster", poster_path: null },
          ],
        })
      )
    );

    const { result } = renderHookWithProviders(() => useSearch("poster"));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });
});

describe("useHomeContent", () => {
  it("fetches home content for the active language", async () => {
    const { result } = renderHookWithProviders(() => useHomeContent());
    await waitFor(() => expect(result.current.data).toBeTruthy());
  });
});

describe("useMovieDetails", () => {
  function renderDetails(hook: () => ReturnType<typeof useMovieDetails>) {
    return renderHook(hook, {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={createTestQueryClient()}>
          {children}
        </QueryClientProvider>
      ),
    });
  }

  it("uses an English fallback overview for localized empty overviews", async () => {
    await act(async () => {
      await i18n.changeLanguage("pl");
    });

    const requestedLanguages: (string | null)[] = [];
    server.use(
      http.get(`${TMDB_BASE}/movie/550`, ({ request }) => {
        const lang = new URL(request.url).searchParams.get("language");
        requestedLanguages.push(lang);
        return HttpResponse.json(
          lang === "en-US"
            ? {
                id: 550,
                title: "Fight Club",
                overview: "English overview",
                poster_path: "/poster.jpg",
                genres: [],
              }
            : {
                id: 550,
                title: "Fight Club",
                overview: "",
                poster_path: "/poster.jpg",
                genres: [],
              }
        );
      })
    );

    const { result } = renderDetails(() => useMovieDetails(550));

    await waitFor(() => {
      expect(result.current.data?.overview).toBe("English overview");
    });
    expect(requestedLanguages).toEqual(["pl-PL", "en-US"]);

    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("keeps a non-empty localized overview without falling back", async () => {
    await act(async () => {
      await i18n.changeLanguage("pl");
    });

    const requestedLanguages: (string | null)[] = [];
    server.use(
      http.get(`${TMDB_BASE}/movie/550`, ({ request }) => {
        const lang = new URL(request.url).searchParams.get("language");
        requestedLanguages.push(lang);
        return HttpResponse.json({
          id: 550,
          title: "Fight Club",
          overview: "Polski opis",
          poster_path: "/poster.jpg",
          genres: [],
        });
      })
    );

    const { result } = renderDetails(() => useMovieDetails(550));

    await waitFor(() => {
      expect(result.current.data?.overview).toBe("Polski opis");
    });
    expect(requestedLanguages).toEqual(["pl-PL"]);

    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });
});

describe("useTvSeason", () => {
  it("fetches a season for the active language", async () => {
    const season = {
      id: 1396,
      season_number: 1,
      episodes: [],
      name: "Season 1",
    };
    server.use(
      http.get(`${TMDB_BASE}/tv/1396/season/1`, () =>
        HttpResponse.json(season)
      )
    );

    const { result } = renderHookWithProviders(() => useTvSeason(1396, 1));
    await waitFor(() => expect(result.current.data).toBeTruthy());
    expect(result.current.data).toEqual(season);
  });
});
