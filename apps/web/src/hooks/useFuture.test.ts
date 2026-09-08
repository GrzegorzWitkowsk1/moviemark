import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";
import {
  useFutureList,
  useFutureMovieControls,
  useFutureSeriesControls,
  useMovieFutureStatus,
} from "./useFuture";
import { renderHookWithProviders } from "@/test/utils";

const api = vi.hoisted(() => ({
  addFutureMovie: vi.fn(),
  addFutureSeries: vi.fn(),
  getFutureList: vi.fn(),
  getFutureMovieStatus: vi.fn(),
  getFutureSeriesStatus: vi.fn(),
  removeFutureMovie: vi.fn(),
  removeFutureSeries: vi.fn(),
}));

vi.mock("@/lib/api", () => api);

beforeEach(() => {
  api.addFutureMovie.mockReset();
  api.addFutureSeries.mockReset();
  api.getFutureList.mockReset();
  api.getFutureMovieStatus.mockReset();
  api.getFutureSeriesStatus.mockReset();
  api.removeFutureMovie.mockReset();
  api.removeFutureSeries.mockReset();
});

describe("useFutureList / useMovieFutureStatus", () => {
  it("fetches the future list", async () => {
    const list = { movies: [], series: [] };
    api.getFutureList.mockResolvedValue(list);

    const { result } = renderHookWithProviders(() => useFutureList());
    await waitFor(() => expect(result.current.data).toEqual(list));
  });

  it("skips the status request when the movie id is invalid", async () => {
    const { result } = renderHookWithProviders(() => useMovieFutureStatus(0));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(api.getFutureMovieStatus).not.toHaveBeenCalled();
  });
});

describe("useFutureMovieControls", () => {
  it("adds the movie when it is not wanted", async () => {
    api.getFutureMovieStatus
      .mockResolvedValueOnce({ wanted: false })
      .mockResolvedValue({ wanted: true });
    api.addFutureMovie.mockResolvedValue({ wanted: true });

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
    expect(api.addFutureMovie.mock.calls[0][0]).toEqual({
      tmdbId: 550,
      title: "Fight Club",
      posterPath: "/poster.jpg",
      rating: 8.4,
    });
  });

  it("removes the movie when it is already wanted", async () => {
    api.getFutureMovieStatus
      .mockResolvedValueOnce({ wanted: true })
      .mockResolvedValue({ wanted: false });
    api.removeFutureMovie.mockResolvedValue({ wanted: false });

    const { result } = renderHookWithProviders(() =>
      useFutureMovieControls(550, { title: "Fight Club", posterPath: null })
    );

    await waitFor(() => expect(result.current.wanted).toBe(true));

    await act(async () => {
      result.current.toggle();
    });

    await waitFor(() => expect(result.current.wanted).toBe(false));
    expect(api.removeFutureMovie.mock.calls[0][0]).toBe(550);
  });
});

describe("useFutureSeriesControls", () => {
  it("adds the series with the given metadata", async () => {
    api.getFutureSeriesStatus
      .mockResolvedValueOnce({ wanted: false })
      .mockResolvedValue({ wanted: true });
    api.addFutureSeries.mockResolvedValue({ wanted: true });

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
    expect(api.addFutureSeries.mock.calls[0][0]).toEqual({
      tmdbId: 1396,
      name: "Breaking Bad",
      posterPath: null,
      rating: 9.5,
    });
  });

  it("removes the series when it is no longer wanted", async () => {
    api.getFutureSeriesStatus
      .mockResolvedValueOnce({ wanted: true })
      .mockResolvedValue({ wanted: false });
    api.removeFutureSeries.mockResolvedValue({ wanted: false });

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
    expect(api.removeFutureSeries.mock.calls[0][0]).toBe(1396);
  });
});