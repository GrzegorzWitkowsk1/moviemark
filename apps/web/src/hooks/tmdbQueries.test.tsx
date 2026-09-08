import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import i18n from "@/i18n";
import { createTestQueryClient, renderHookWithProviders } from "@/test/utils";

const tmdb = vi.hoisted(() => ({
  searchMulti: vi.fn(),
  getHomeContent: vi.fn(),
  getMovieDetails: vi.fn(),
  getTvDetails: vi.fn(),
  getSimilarMovies: vi.fn(),
  getTvSeason: vi.fn(),
}));

vi.mock("@/lib/tmdb", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/tmdb")>();
  return {
    ...tmdb,
    tmdbLanguage: actual.tmdbLanguage,
  };
});

const { useSearch } = await import("./useSearch");
const { useHomeContent } = await import("./useHomeContent/useHomeContent");
const { useMovieDetails } = await import("./useDetails/useDetails");
const { useTvSeason } = await import("./useDetails/useTvSeason");

beforeEach(() => {
  tmdb.searchMulti.mockReset();
  tmdb.getHomeContent.mockReset();
  tmdb.getMovieDetails.mockReset();
  tmdb.getTvDetails.mockReset();
  tmdb.getSimilarMovies.mockReset();
  tmdb.getTvSeason.mockReset();
});

describe("useSearch", () => {
  it("debounces nothing at the hook level, keeps the query key bound to the language", async () => {
    tmdb.searchMulti.mockResolvedValue({ results: [] });
    let apiCalls = 0;
    tmdb.searchMulti.mockImplementation(async () => {
      apiCalls += 1;
      return { results: [] };
    });

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
    tmdb.searchMulti.mockResolvedValue({
      results: [
        { id: 1, media_type: "movie", title: "With poster", poster_path: "/a.jpg" },
        { id: 2, media_type: "movie", title: "No poster", poster_path: null },
      ],
    });

    const { result } = renderHookWithProviders(() => useSearch("poster"));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });
});

describe("useHomeContent", () => {
  it("fetches home content for the active language", async () => {
    tmdb.getHomeContent.mockResolvedValue({ new: [], trending: [], upcoming: { movies: [] } });

    const { result } = renderHookWithProviders(() => useHomeContent());
    await waitFor(() => expect(result.current.data).toBeTruthy());
    expect(tmdb.getHomeContent).toHaveBeenCalledTimes(1);
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

    tmdb.getMovieDetails
      .mockResolvedValueOnce({
        id: 550,
        title: "Fight Club",
        overview: "",
        poster_path: "/poster.jpg",
      })
      .mockResolvedValueOnce({
        id: 550,
        title: "Fight Club",
        overview: "English overview",
        poster_path: "/poster.jpg",
      });

    const { result } = renderDetails(() => useMovieDetails(550));

    await waitFor(() => {
      expect(result.current.data?.overview).toBe("English overview");
    });
    expect(tmdb.getMovieDetails).toHaveBeenNthCalledWith(1, 550);
    expect(tmdb.getMovieDetails).toHaveBeenNthCalledWith(2, 550, "en-US");

    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("keeps a non-empty localized overview without falling back", async () => {
    await act(async () => {
      await i18n.changeLanguage("pl");
    });

    tmdb.getMovieDetails.mockResolvedValue({
      id: 550,
      title: "Fight Club",
      overview: "Polski opis",
      poster_path: "/poster.jpg",
    });

    const { result } = renderDetails(() => useMovieDetails(550));

    await waitFor(() => {
      expect(result.current.data?.overview).toBe("Polski opis");
    });
    expect(tmdb.getMovieDetails).toHaveBeenCalledTimes(1);

    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });
});

describe("useTvSeason", () => {
  it("fetches a season for the active language", async () => {
    tmdb.getTvSeason.mockResolvedValue({
      id: 1396,
      season_number: 1,
      episodes: [],
      name: "Season 1",
    });

    const { result } = renderHookWithProviders(() => useTvSeason(1396, 1));
    await waitFor(() => expect(result.current.data).toBeTruthy());
    expect(tmdb.getTvSeason).toHaveBeenCalledWith(1396, 1);
  });
});