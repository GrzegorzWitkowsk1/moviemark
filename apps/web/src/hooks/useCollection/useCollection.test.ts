import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, waitFor } from "@testing-library/react";
import {
  movieStatusKey,
  seriesStatusKey,
  useAddMovie,
  useCheckEpisode,
  useCollection,
  useMovieWatched,
  useRemoveMovie,
  useSeriesWatchedControls,
  useUncheckEpisode,
} from "./index";
import {
  renderHookWithProviders,
  createTestQueryClient,
} from "@/test/utils";

const api = vi.hoisted(() => ({
  addMovieToCollection: vi.fn(),
  removeMovieFromCollection: vi.fn(),
  checkSeriesEpisode: vi.fn(),
  uncheckSeriesEpisode: vi.fn(),
  getCollection: vi.fn(),
  getMovieCollectionStatus: vi.fn(),
  getSeriesCollectionStatus: vi.fn(),
}));

vi.mock("@/lib/api", () => api);

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const movieStatus = { watched: false };
const seriesStatus = {
  watched: false,
  watchedCount: 0,
  totalEpisodes: 12,
  watchedEpisodes: [
    { season: 1, episode: 1 },
    { season: 1, episode: 2 },
  ],
};

beforeEach(() => {
  api.addMovieToCollection.mockReset();
  api.removeMovieFromCollection.mockReset();
  api.checkSeriesEpisode.mockReset();
  api.uncheckSeriesEpisode.mockReset();
  api.getCollection.mockReset();
  api.getMovieCollectionStatus.mockReset();
  api.getSeriesCollectionStatus.mockReset();
});

describe("useCollection / useMovieWatched / useSeriesWatched", () => {
  it("fetches the full collection", async () => {
    const collection = { movies: [{ tmdbId: 1 }], series: [] };
    api.getCollection.mockResolvedValue(collection);

    const { result } = renderHookWithProviders(() => useCollection());
    await waitFor(() => expect(result.current.data).toEqual(collection));
  });

  it("uses the movie status key", async () => {
    api.getMovieCollectionStatus.mockResolvedValue(movieStatus);
    const { result } = renderHookWithProviders(() => useMovieWatched(550));
    await waitFor(() => expect(result.current.data).toEqual(movieStatus));
  });

  it("skips the request when the movie id is not valid", async () => {
    const { result } = renderHookWithProviders(() => useMovieWatched(0));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(api.getMovieCollectionStatus).not.toHaveBeenCalled();
  });
});

describe("useAddMovie", () => {
  it("optimistically marks the movie watched, then applies the server result", async () => {
    const pending = deferred<{ watched: boolean }>();
    api.addMovieToCollection.mockReturnValue(pending.promise);

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(movieStatusKey(550), { watched: false });

    const { result } = renderHookWithProviders(() => useAddMovie(), {
      queryClient,
    });

    await act(async () => {
      void result.current.mutate({
        tmdbId: 550,
        title: "Fight Club",
        posterPath: null,
        rating: 8.4,
      });
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(movieStatusKey(550))).toEqual({
        watched: true,
      });
    });

    await act(async () => {
      pending.resolve({ watched: true });
      await pending.promise;
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(movieStatusKey(550))).toEqual({
        watched: true,
      });
    });
    expect(api.addMovieToCollection.mock.calls[0][0]).toEqual({
      tmdbId: 550,
      title: "Fight Club",
      posterPath: null,
      rating: 8.4,
    });
  });
});

describe("useRemoveMovie", () => {
  it("optimistically marks the movie not watched", async () => {
    const pending = deferred<{ watched: boolean }>();
    api.removeMovieFromCollection.mockReturnValue(pending.promise);

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(movieStatusKey(550), { watched: true });

    const { result } = renderHookWithProviders(() => useRemoveMovie(), {
      queryClient,
    });

    await act(async () => {
      void result.current.mutate(550);
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(movieStatusKey(550))).toEqual({
        watched: false,
      });
    });

    await act(async () => {
      pending.resolve({ watched: false });
      await pending.promise;
    });
  });
});

describe("useCheckEpisode", () => {
  it("deduplicates episodes in the optimistic update", async () => {
    const pending = deferred<typeof seriesStatus>();
    api.checkSeriesEpisode.mockReturnValue(pending.promise);

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(seriesStatusKey(550), seriesStatus);

    const { result } = renderHookWithProviders(() => useCheckEpisode(), {
      queryClient,
    });

    await act(async () => {
      void result.current.mutate({
        tmdbId: 550,
        season: 1,
        episodes: [1, 5],
        name: "Dune",
        posterPath: null,
        totalEpisodes: 12,
      });
    });

    await waitFor(() => {
      expect(
        queryClient.getQueryData(seriesStatusKey(550))
      ).toMatchObject({
        watchedCount: 3,
        watchedEpisodes: [
          { season: 1, episode: 1 },
          { season: 1, episode: 2 },
          { season: 1, episode: 5 },
        ],
      });
    });

    await act(async () => {
      pending.resolve(seriesStatus);
      await pending.promise;
    });
  });
});

describe("useUncheckEpisode", () => {
  it("removes the episode in the optimistic update", async () => {
    const pending = deferred<typeof seriesStatus>();
    api.uncheckSeriesEpisode.mockReturnValue(pending.promise);

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(seriesStatusKey(550), {
      ...seriesStatus,
      watched: true,
      watchedCount: 2,
    });

    const { result } = renderHookWithProviders(() => useUncheckEpisode(), {
      queryClient,
    });

    await act(async () => {
      void result.current.mutate({ tmdbId: 550, season: 1, episode: 2 });
    });

    await waitFor(() => {
      expect(
        queryClient.getQueryData(seriesStatusKey(550))
      ).toMatchObject({
        watched: true,
        watchedCount: 1,
        watchedEpisodes: [{ season: 1, episode: 1 }],
      });
    });

    await act(async () => {
      pending.resolve(seriesStatus);
      await pending.promise;
    });
  });
});

describe("useSeriesWatchedControls", () => {
  it("exposes helpers built on the watched episodes", async () => {
    api.getSeriesCollectionStatus.mockResolvedValue(seriesStatus);
    api.checkSeriesEpisode.mockResolvedValue(seriesStatus);

    const { result } = renderHookWithProviders(() =>
      useSeriesWatchedControls(550, {
        name: "Dune",
        posterPath: null,
        totalEpisodes: 12,
        rating: 8.5,
      })
    );

    await waitFor(() => {
      expect(result.current.isEpisodeWatched(1, 1)).toBe(true);
    });
    expect(result.current.isEpisodeWatched(1, 9)).toBe(false);
    expect(result.current.countWatchedEpisodes(1)).toBe(2);

    await act(async () => {
      await result.current.markEpisodesWatched(1, [3]);
    });

    expect(api.checkSeriesEpisode.mock.calls[0][0]).toEqual({
      tmdbId: 550,
      season: 1,
      episodes: [3],
      name: "Dune",
      posterPath: null,
      totalEpisodes: 12,
      rating: 8.5,
    });
  });
});