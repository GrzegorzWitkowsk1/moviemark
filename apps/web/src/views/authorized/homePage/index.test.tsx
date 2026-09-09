import { beforeEach, describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { useLocation } from "react-router-dom";
import HomePage from "./index";
import type { TmdbMovie, TmdbTv } from "shared";
import { renderWithProviders } from "@/test/utils";
import { server } from "@/test/server";
import { TMDB_BASE } from "@/test/handlers/tmdbHandlers";

function movie(id: number, title: string): TmdbMovie {
  return {
    adult: false,
    backdrop_path: null,
    genre_ids: [28],
    id,
    original_language: "en",
    original_title: title,
    overview: "Overview",
    popularity: 1,
    poster_path: `/p${id}.jpg`,
    release_date: "2024-01-01",
    title,
    video: false,
    vote_average: 7,
    vote_count: 100,
  };
}

const series: TmdbTv = {
  adult: false,
  backdrop_path: null,
  first_air_date: "2023-01-01",
  genre_ids: [18],
  id: 100,
  name: "Breaking Bad: Origins",
  origin_country: ["US"],
  original_language: "en",
  original_name: "Breaking Bad: Origins",
  overview: "Overview",
  popularity: 5,
  poster_path: "/s100.jpg",
  vote_average: 9,
  vote_count: 200,
};

const homeContent = {
  new: { movies: [movie(1, "Fight Club")], series: [] },
  upcoming: { movies: [movie(2, "Dune: Part Two")] },
  trending: { movies: [], series: [series] },
};

function listResult(results: unknown[] = []) {
  return {
    page: 1,
    results,
    total_pages: results.length === 0 ? 0 : 1,
    total_results: results.length,
  };
}

function LocationProbe() {
  const location = useLocation();
  return (
    <div data-testid="probe">
      {location.pathname}
      {location.search}
    </div>
  );
}

beforeEach(() => {
  server.use(
    http.get(`${TMDB_BASE}/movie/now_playing`, () =>
      HttpResponse.json(listResult(homeContent.new.movies))
    ),
    http.get(`${TMDB_BASE}/tv/on_the_air`, () =>
      HttpResponse.json(listResult(homeContent.new.series))
    ),
    http.get(`${TMDB_BASE}/movie/upcoming`, () =>
      HttpResponse.json(listResult(homeContent.upcoming.movies))
    ),
    http.get(`${TMDB_BASE}/trending/movie/day`, () =>
      HttpResponse.json(listResult(homeContent.trending.movies))
    ),
    http.get(`${TMDB_BASE}/trending/tv/day`, () =>
      HttpResponse.json(listResult(homeContent.trending.series))
    )
  );
});

describe("HomePage", () => {
  it("renders each content section", async () => {
    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText("Fight Club")).toBeTruthy();
    });
    expect(screen.getByText("Dune: Part Two")).toBeTruthy();
    expect(screen.getByText("Breaking Bad: Origins")).toBeTruthy();
    expect(screen.getByText("New Releases")).toBeTruthy();
    expect(screen.getByText("Upcoming")).toBeTruthy();
    expect(screen.getByText("Trending")).toBeTruthy();
  });

  it("navigates to the search page with the query", async () => {
    const userEventCtx = userEvent.setup();
    renderWithProviders(
      <>
        <HomePage />
        <LocationProbe />
      </>
    );

    await userEventCtx.type(
      screen.getByPlaceholderText("Search movies & series..."),
      "fight"
    );
    await userEventCtx.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(screen.getByTestId("probe").textContent).toBe(
        "/auth/search?q=fight"
      );
    });
  });
});