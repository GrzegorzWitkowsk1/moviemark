import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FutureMovieResponse, FutureSeriesResponse } from "shared";
import WantToWatchPage from "./index";
import { renderWithProviders } from "@/test/utils";

const api = vi.hoisted(() => ({
  getFutureList: vi.fn(),
}));

vi.mock("@/lib/api", () => api);

const tmdb = vi.hoisted(() => ({
  getGenres: vi.fn(),
  tmdbLanguage: vi.fn(),
}));

vi.mock("@/lib/tmdb", () => tmdb);

const futureMovie: FutureMovieResponse = {
  tmdbId: 550,
  title: "Fight Club",
  posterPath: "/fc.jpg",
  addedAt: "2026-01-02T00:00:00Z",
  mediaType: "movie",
  year: "1999",
  rating: 8.4,
};

const futureSeries: FutureSeriesResponse = {
  tmdbId: 1396,
  name: "Breaking Bad",
  posterPath: "/bb.jpg",
  addedAt: "2026-01-01T00:00:00Z",
  mediaType: "tv",
  year: "2008",
  rating: 9.5,
};

beforeEach(() => {
  api.getFutureList.mockReset();
  tmdb.getGenres.mockReset();
  tmdb.tmdbLanguage.mockReset();
  tmdb.tmdbLanguage.mockReturnValue("en-US");
  tmdb.getGenres.mockImplementation(async (mediaType: string) => ({
    genres:
      mediaType === "movie"
        ? [{ id: 28, name: "Action" }]
        : [{ id: 18, name: "Drama" }],
  }));
});

describe("WantToWatchPage", () => {
  it("filters the list by media type", async () => {
    api.getFutureList.mockResolvedValue({
      movies: [futureMovie],
      series: [futureSeries],
    });
    const userEventCtx = userEvent.setup();

    renderWithProviders(<WantToWatchPage />);

    await waitFor(() => {
      expect(screen.getByText("Fight Club")).toBeTruthy();
    });
    expect(screen.queryByText("Breaking Bad")).toBeNull();

    await userEventCtx.click(screen.getByText("Series"));
    await waitFor(() => {
      expect(screen.getByText("Breaking Bad")).toBeTruthy();
    });
    expect(screen.queryByText("Fight Club")).toBeNull();
  });

  it("shows the empty state when no items are saved", async () => {
    api.getFutureList.mockResolvedValue({ movies: [], series: [] });

    renderWithProviders(<WantToWatchPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Your want to watch list is empty.")
      ).toBeTruthy();
    });
  });
});