import { describe, expect, it } from "vitest";
import { act, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import {
  useFutureList,
  useFutureMovieControls,
  useFutureSeriesControls,
  useMovieFutureStatus,
} from "./useFuture";
import { renderHookWithProviders } from "@/test/utils";
import { server } from "@/test/server";

const API = "http://localhost:3000";

describe("useFutureList / useMovieFutureStatus", () => {
  it("fetches the future list", async () => {
    const list = { movies: [], series: [] };
    server.use(
      http.get(`${API}/future`, () => HttpResponse.json(list))
    );

    const { result } = renderHookWithProviders(() => useFutureList());
    await waitFor(() => expect(result.current.data).toEqual(list));
  });

  it("skips the status request when the movie id is invalid", async () => {
    const { result } = renderHookWithProviders(() => useMovieFutureStatus(0));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });
});

describe("useFutureMovieControls", () => {
  it("adds the movie when it is not wanted", async () => {
    let wanted = false;
    let lastAddBody: unknown;
    server.use(
      http.get(`${API}/future/movie/550`, () => HttpResponse.json({ wanted })),
      http.post(`${API}/future/movie`, async ({ request }) => {
        lastAddBody = await request.json();
        wanted = true;
        return HttpResponse.json({ wanted });
      })
    );

    const { result } = renderHookWithProviders(() =>
      useFutureMovieControls(550, {
        title: "Fight Club",
        posterPath: "/poster.jpg",
        rating: 8.4,
      })
    );

    await waitFor(() => expect(result.current.wanted).toBe(false));

    await act(async () => {
      result.current.toggle();
    });

    await waitFor(() => expect(result.current.wanted).toBe(true));
    expect(lastAddBody).toEqual({
      tmdbId: 550,
      title: "Fight Club",
      posterPath: "/poster.jpg",
      rating: 8.4,
    });
  });

  it("removes the movie when it is already wanted", async () => {
    let wanted = true;
    let removedId: string | undefined;
    server.use(
      http.get(`${API}/future/movie/550`, () => HttpResponse.json({ wanted })),
      http.delete(`${API}/future/movie/:tmdbId`, ({ params }) => {
        removedId = String(params.tmdbId);
        wanted = false;
        return HttpResponse.json({ wanted });
      })
    );

    const { result } = renderHookWithProviders(() =>
      useFutureMovieControls(550, { title: "Fight Club", posterPath: null })
    );

    await waitFor(() => expect(result.current.wanted).toBe(true));

    await act(async () => {
      result.current.toggle();
    });

    await waitFor(() => expect(result.current.wanted).toBe(false));
    expect(removedId).toBe("550");
  });
});

describe("useFutureSeriesControls", () => {
  it("adds the series with the given metadata", async () => {
    let wanted = false;
    let lastAddBody: unknown;
    server.use(
      http.get(`${API}/future/series/1396`, () =>
        HttpResponse.json({ wanted })
      ),
      http.post(`${API}/future/series`, async ({ request }) => {
        lastAddBody = await request.json();
        wanted = true;
        return HttpResponse.json({ wanted });
      })
    );

    const { result } = renderHookWithProviders(() =>
      useFutureSeriesControls(1396, {
        name: "Breaking Bad",
        posterPath: null,
        rating: 9.5,
      })
    );

    await waitFor(() => expect(result.current.wanted).toBe(false));

    await act(async () => {
      result.current.toggle();
    });

    await waitFor(() => expect(result.current.wanted).toBe(true));
    expect(lastAddBody).toEqual({
      tmdbId: 1396,
      name: "Breaking Bad",
      posterPath: null,
      rating: 9.5,
    });
  });

  it("removes the series when it is no longer wanted", async () => {
    let wanted = true;
    let removedId: string | undefined;
    server.use(
      http.get(`${API}/future/series/1396`, () =>
        HttpResponse.json({ wanted })
      ),
      http.delete(`${API}/future/series/:tmdbId`, ({ params }) => {
        removedId = String(params.tmdbId);
        wanted = false;
        return HttpResponse.json({ wanted });
      })
    );

    const { result } = renderHookWithProviders(() =>
      useFutureSeriesControls(1396, {
        name: "Breaking Bad",
        posterPath: null,
      })
    );

    await waitFor(() => expect(result.current.wanted).toBe(true));

    await act(async () => {
      result.current.toggle();
    });

    await waitFor(() => expect(result.current.wanted).toBe(false));
    expect(removedId).toBe("1396");
  });
});
