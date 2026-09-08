import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CustomMovieResponse, TmdbMovieDetails } from "shared";
import DetailsPage from "./index";
import { renderWithProviders } from "@/test/utils";

const tmdb = vi.hoisted(() => ({
  getGenres: vi.fn(),
  tmdbLanguage: vi.fn(),
  getMovieDetails: vi.fn(),
  getSimilarMovies: vi.fn(),
  getTvDetails: vi.fn(),
  getSimilarTv: vi.fn(),
}));

vi.mock("@/lib/tmdb", () => tmdb);

const api = vi.hoisted(() => ({
  getMovieCollectionStatus: vi.fn(),
  getSeriesCollectionStatus: vi.fn(),
  getFutureMovieStatus: vi.fn(),
  getFutureSeriesStatus: vi.fn(),
  addMovieToCollection: vi.fn(),
  removeMovieFromCollection: vi.fn(),
  addFutureMovie: vi.fn(),
  addFutureSeries: vi.fn(),
  removeFutureMovie: vi.fn(),
  removeFutureSeries: vi.fn(),
  checkSeriesEpisode: vi.fn(),
  uncheckSeriesEpisode: vi.fn(),
  getCustomItem: vi.fn(),
}));

vi.mock("@/lib/api", () => api);

const movie: TmdbMovieDetails = {
  adult: false,
  backdrop_path: "/fc-bg.jpg",
  genre_ids: [28, 18],
  genres: [],
  id: 550,
  original_language: "en",
  original_title: "Fight Club",
  overview: "A nameless narrator.",
  popularity: 75,
  poster_path: "/fc.jpg",
  release_date: "1999-10-15",
  runtime: 139,
  tagline: null,
  status: "Released",
  title: "Fight Club",
  video: false,
  vote_average: 8.4,
  vote_count: 23000,
};

const similarMovie: TmdbMovieDetails = {
  ...movie,
  id: 680,
  title: "Pulp Fiction",
  original_title: "Pulp Fiction",
  overview: "The lives of two mob hitmen.",
  vote_average: 9.1,
  vote_count: 20000,
};

beforeEach(() => {
  Object.values(tmdb).forEach((fn) => fn.mockReset());
  Object.values(api).forEach((fn) => fn.mockReset());
  tmdb.tmdbLanguage.mockReturnValue("en-US");
  tmdb.getGenres.mockResolvedValue({ genres: [] });
  api.getMovieCollectionStatus.mockResolvedValue({ watched: false });
  api.getFutureMovieStatus.mockResolvedValue({ wanted: false });
  api.getSeriesCollectionStatus.mockResolvedValue({
    watched: false,
    watchedCount: 0,
    totalEpisodes: 0,
    watchedEpisodes: [],
  });
  api.getFutureSeriesStatus.mockResolvedValue({ wanted: false });
  api.addMovieToCollection.mockResolvedValue({});
  api.addFutureMovie.mockResolvedValue({});
});

describe("DetailsPage", () => {
  it("shows a missing-id notice when no id is provided", () => {
    renderWithProviders(<DetailsPage />, { route: "/auth/movies" });

    expect(
      screen.getByText("Missing or invalid movie/series id.")
    ).toBeTruthy();
  });

  it("renders a movie with its hero meta and similar titles", async () => {
    tmdb.getMovieDetails.mockResolvedValue(movie);
    tmdb.getSimilarMovies.mockResolvedValue({
      page: 1,
      total_pages: 1,
      total_results: 1,
      results: [similarMovie],
    });

    renderWithProviders(<DetailsPage />, {
      route: "/auth/movies?id=550&type=movie",
    });

    await waitFor(() => {
      expect(screen.getByText("Fight Club")).toBeTruthy();
    });
    expect(screen.getByText("8.4")).toBeTruthy();
    expect(screen.getByText("1999-10-15")).toBeTruthy();
    expect(screen.getByText("139 min.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add to watched" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Watch in future" })).toBeTruthy();
    expect(screen.getByText("You may also like")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("Pulp Fiction")).toBeTruthy();
    });
  });

  it("marks a movie as watched", async () => {
    tmdb.getMovieDetails.mockResolvedValue(movie);
    tmdb.getSimilarMovies.mockResolvedValue({
      page: 1,
      total_pages: 0,
      total_results: 0,
      results: [],
    });
    const userEventCtx = userEvent.setup();

    renderWithProviders(<DetailsPage />, {
      route: "/auth/movies?id=550&type=movie",
    });

    const addButton = await screen.findByRole("button", {
      name: "Add to watched",
    });
    await userEventCtx.click(addButton);

    await waitFor(() => {
      expect(api.addMovieToCollection.mock.calls[0][0]).toEqual({
        tmdbId: 550,
        title: "Fight Club",
        posterPath: "/fc.jpg",
        rating: 8.4,
      });
    });
  });

  it("renders a custom movie and marks it as watched", async () => {
    const customMovie: CustomMovieResponse = {
      customId: -1,
      mediaType: "movie",
      name: "My Movie",
      genreIds: [],
      year: "2024",
      runtimeMinutes: 120,
      watchedAt: "2026-01-01T00:00:00Z",
    };
    api.getCustomItem.mockResolvedValue(customMovie);
    const userEventCtx = userEvent.setup();

    renderWithProviders(<DetailsPage />, {
      route: "/auth/movies?id=-1&type=movie",
    });

    await waitFor(() => {
      expect(screen.getByText("My Movie")).toBeTruthy();
    });
    expect(screen.getByText("2024")).toBeTruthy();
    expect(screen.getByText("120 min.")).toBeTruthy();

    await userEventCtx.click(
      screen.getByRole("button", { name: "Add to watched" })
    );

    await waitFor(() => {
      expect(api.addMovieToCollection.mock.calls[0][0]).toEqual({
        tmdbId: -1,
        title: "My Movie",
        posterPath: null,
      });
    });
  });
});