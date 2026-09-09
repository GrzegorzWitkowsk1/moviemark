import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import type { WatchedMovieResponse, WatchedSeriesResponse } from "shared";
import CollectionPage from "./index";
import { renderWithProviders } from "@/test/utils";
import { server } from "@/test/server";

const API = "http://localhost:3000";

const watchedMovie: WatchedMovieResponse = {
  tmdbId: 550,
  title: "Fight Club",
  posterPath: "/fc.jpg",
  watchedAt: "2026-01-02T10:00:00Z",
  mediaType: "movie",
  year: "1999",
  rating: 8.4,
};

const watchedSeries: WatchedSeriesResponse = {
  tmdbId: 1396,
  name: "Breaking Bad",
  posterPath: "/bb.jpg",
  totalEpisodes: 62,
  watchedCount: 31,
  watchedEpisodes: [],
  watchedAt: "2026-01-01T10:00:00Z",
  mediaType: "tv",
  year: "2008",
  rating: 9.5,
};

describe("CollectionPage", () => {
  it("groups and filters watched items by media type", async () => {
    server.use(
      http.get(`${API}/collection`, () =>
        HttpResponse.json({
          movies: [watchedMovie],
          series: [watchedSeries],
        })
      )
    );
    const userEventCtx = userEvent.setup();

    renderWithProviders(<CollectionPage />);

    await waitFor(() => {
      expect(screen.getByText("Fight Club")).toBeTruthy();
    });
    expect(screen.queryByText("Breaking Bad")).toBeNull();
    expect(screen.getByText("01.2026")).toBeTruthy();

    await userEventCtx.click(screen.getByText("Series"));
    await waitFor(() => {
      expect(screen.getByText("Breaking Bad")).toBeTruthy();
    });
    expect(screen.queryByText("Fight Club")).toBeNull();
  });

  it("shows the empty state when the collection is empty", async () => {
    server.use(
      http.get(`${API}/collection`, () =>
        HttpResponse.json({ movies: [], series: [] })
      )
    );

    renderWithProviders(<CollectionPage />);

    await waitFor(() => {
      expect(screen.getByText("Your collection is empty.")).toBeTruthy();
    });
  });
});