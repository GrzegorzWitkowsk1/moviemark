import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import type { FutureMovieResponse, FutureSeriesResponse } from "shared";
import WantToWatchPage from "./index";
import { renderWithProviders } from "@/test/utils";
import { server } from "@/test/server";

const API = "http://localhost:3000";

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

describe("WantToWatchPage", () => {
  it("filters the list by media type", async () => {
    server.use(
      http.get(`${API}/future`, () =>
        HttpResponse.json({
          movies: [futureMovie],
          series: [futureSeries],
        })
      )
    );
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
    server.use(
      http.get(`${API}/future`, () =>
        HttpResponse.json({ movies: [], series: [] })
      )
    );

    renderWithProviders(<WantToWatchPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Your want to watch list is empty.")
      ).toBeTruthy();
    });
  });
});