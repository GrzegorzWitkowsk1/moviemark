import { describe, expect, it } from "vitest";
import { act, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
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
import { server } from "@/test/server";

const API = "http://localhost:3000";

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

describe("useCollection / useMovieWatched / useSeriesWatched", () => {
  it("fetches the full collection", async () => {
    const collection = { movies: [{ tmdbId: 1 }], series: [] };
    server.use(
      http.get(`${API}/collection`, () => HttpResponse.json(collection))
    );

    const { result } = renderHookWithProviders(() => useCollection());
    await waitFor(() => expect(result.current.data).toEqual(collection));
  });

  it("uses the movie status key", async () => {
    server.use(
      http.get(`${API}/collection/movie/550`, () =>
        HttpResponse.json(movieStatus)
      )
    );
    const { result } = renderHookWithProviders(() => useMovieWatched(550));
    await waitFor(() => expect(result.current.data).toEqual(movieStatus));
  });

  it("skips the request when the movie id is not valid", async () => {
    const { result } = renderHookWithProviders(() => useMovieWatched(0));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });
});

describe("useAddMovie", () => {
  it("optimistically marks the movie watched, then applies the server result", async () => {
    const pending = deferred<{ watched: boolean }>();
    let lastAddBody: unknown;
    server.use(
      http.post(`${API}/collection/movie`, async ({ request }) => {
        lastAddBody = await request.json();
        return HttpResponse.json(await pending.promise);
      })
    );

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
    expect(lastAddBody).toEqual({
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
    server.use(
      http.delete(`${API}/collection/movie/550`, async () =>
        HttpResponse.json(await pending.promise)
      )
    );

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
    const pending = deferred<(typeof seriesStatus)>();
    server.use(
      http.put(`${API}/collection/series/episode`, async () =>
        HttpResponse.json(await pending.promise)
      )
    );

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
    const pending = deferred<(typeof seriesStatus)>();
    server.use(
      http.delete(`${API}/collection/series/550/episode`, async () =>
        HttpResponse.json(await pending.promise)
      )
    );

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
    let lastCheckBody: unknown;
    server.use(
      http.get(`${API}/collection/series/550`, () =>
        HttpResponse.json(seriesStatus)
      ),
      http.put(`${API}/collection/series/episode`, async ({ request }) => {
        lastCheckBody = await request.json();
        return HttpResponse.json(seriesStatus);
      })
    );

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

    expect(lastCheckBody).toEqual({
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
