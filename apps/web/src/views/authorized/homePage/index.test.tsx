import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router-dom";
import HomePage from "./index";
import type { TmdbMovie, TmdbTv } from "shared";
import { renderWithProviders } from "@/test/utils";

const tmdb = vi.hoisted(() => ({
  getGenres: vi.fn(),
  getHomeContent: vi.fn(),
  tmdbLanguage: vi.fn(),
}));

vi.mock("@/lib/tmdb", () => tmdb);

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
  tmdb.getGenres.mockReset();
  tmdb.getHomeContent.mockReset();
  tmdb.tmdbLanguage.mockReset();
  tmdb.tmdbLanguage.mockReturnValue("en-US");
  tmdb.getGenres.mockImplementation(async (mediaType: string) => ({
    genres:
      mediaType === "movie"
        ? [{ id: 28, name: "Action" }]
        : [{ id: 18, name: "Drama" }],
  }));
  tmdb.getHomeContent.mockResolvedValue(homeContent);
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