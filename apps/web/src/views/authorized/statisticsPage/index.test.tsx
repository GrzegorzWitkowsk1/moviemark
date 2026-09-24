import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import StatisticsPage from "./index";
import { renderWithProviders } from "@/test/utils";
import { server } from "@/test/server";

const API = "http://localhost:3000";

const statisticsResponse = () => ({
  totalMovies: 3,
  watchedMovies: 3,
  watchedSeries: 1,
  watchedEpisodes: 12,
  movieWatchtimeMinutes: 450,
  seriesWatchtimeMinutes: 120,
  moviesWatchedInYear: 3,
  seriesWatchedInYear: 1,
  watchtimeMinutesInYear: 570,
  fullSeriesWatched: 1,
  favouriteGenres: [
    { genreId: 28, count: 2 },
    { genreId: 878, count: 1 },
  ],
});

describe("StatisticsPage", () => {
  it("renders the statistics overview", async () => {
    renderWithProviders(<StatisticsPage />, { route: "/auth/statistics" });

    expect(
      await screen.findByText(/You watched 3 movies and 1 full series in 2026/)
    ).toBeTruthy();
    expect(
      screen.getByText(
        "9h 30m of total watchtime — keep it going."
      )
    ).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
    expect(screen.getByText("4")).toBeTruthy();
    expect(screen.getByText("2 titles")).toBeTruthy();
    expect(screen.getByText("1 title")).toBeTruthy();
    expect(screen.getByText("Action")).toBeTruthy();
    expect(screen.getByText("Science Fiction")).toBeTruthy();
    expect(screen.getByText("MOST WATCHED")).toBeTruthy();
    expect(screen.getByText("7h 30m")).toBeTruthy();
    expect(screen.getByText("2h")).toBeTruthy();
  });

  it("shows an error state and recovers after retry", async () => {
    server.use(
      http.get(`${API}/statistics`, () =>
        HttpResponse.json({ message: "boom" }, { status: 500 })
      )
    );
    renderWithProviders(<StatisticsPage />, { route: "/auth/statistics" });

    expect(
      await screen.findByText("Something went wrong. Please try again.")
    ).toBeTruthy();

    server.use(
      http.get(`${API}/statistics`, () => HttpResponse.json(statisticsResponse()))
    );
    const userEventCtx = userEvent.setup();
    await userEventCtx.click(screen.getByRole("button", { name: "Try again" }));

    expect(
      await screen.findByText(/You watched 3 movies and 1 full series in 2026/)
    ).toBeTruthy();
  });
});