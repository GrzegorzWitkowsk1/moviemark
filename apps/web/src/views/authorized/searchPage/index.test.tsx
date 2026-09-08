import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TmdbMovie, TmdbTv } from "shared";
import SearchPage from "./index";
import { renderWithProviders } from "@/test/utils";

const tmdb = vi.hoisted(() => ({
  getGenres: vi.fn(),
  searchMulti: vi.fn(),
  tmdbLanguage: vi.fn(),
}));

vi.mock("@/lib/tmdb", () => tmdb);

const api = vi.hoisted(() => ({
  createCustomMovie: vi.fn(),
}));

vi.mock("@/lib/api", () => api);

const movie: TmdbMovie = {
  adult: false,
  backdrop_path: null,
  genre_ids: [28],
  id: 550,
  original_language: "en",
  original_title: "Fight Club",
  overview: "Insomnia",
  popularity: 10,
  poster_path: "/fc.jpg",
  release_date: "1999-10-15",
  title: "Fight Club",
  video: false,
  vote_average: 8.4,
  vote_count: 100,
};

const tv: TmdbTv = {
  adult: false,
  backdrop_path: null,
  first_air_date: "2008-01-20",
  genre_ids: [18],
  id: 1396,
  name: "Breaking Bad",
  origin_country: ["US"],
  original_language: "en",
  original_name: "Breaking Bad",
  overview: "Chemistry",
  popularity: 20,
  poster_path: "/bb.jpg",
  vote_average: 9.5,
  vote_count: 100,
};

beforeEach(() => {
  tmdb.getGenres.mockReset();
  tmdb.searchMulti.mockReset();
  tmdb.tmdbLanguage.mockReset();
  api.createCustomMovie.mockReset();
  tmdb.tmdbLanguage.mockReturnValue("en-US");
  tmdb.getGenres.mockImplementation(async (mediaType: string) => ({
    genres:
      mediaType === "movie"
        ? [{ id: 28, name: "Action" }]
        : [{ id: 18, name: "Drama" }],
  }));
});

describe("SearchPage", () => {
  it("renders results for the query from the URL", async () => {
    tmdb.searchMulti.mockResolvedValue({
      page: 1,
      total_pages: 1,
      total_results: 2,
      results: [movie, tv],
    });

    renderWithProviders(<SearchPage />, { route: "/auth/search?q=fight" });

    await waitFor(() => {
      expect(screen.getByText("Fight Club")).toBeTruthy();
    });
    expect(screen.getByText("Breaking Bad")).toBeTruthy();
    expect(screen.getByText("2 results found")).toBeTruthy();
  });

  it("shows the empty state with an add-custom button when there are no results", async () => {
    tmdb.searchMulti.mockResolvedValue({
      page: 1,
      total_pages: 0,
      total_results: 0,
      results: [],
    });

    renderWithProviders(<SearchPage />, { route: "/auth/search?q=zzz" });

    await waitFor(() => {
      expect(screen.getByText("No results found")).toBeTruthy();
    });
    expect(screen.getByRole("button", { name: "Add movie/series" })).toBeTruthy();
  });

  it("adds a custom movie from the dialog", async () => {
    tmdb.searchMulti.mockResolvedValue({
      page: 1,
      total_pages: 0,
      total_results: 0,
      results: [],
    });
    api.createCustomMovie.mockResolvedValue({
      customId: -1,
      mediaType: "movie",
      name: "My Movie",
      genreIds: [],
      year: null,
      runtimeMinutes: null,
      watchedAt: new Date().toISOString(),
    });
    const userEventCtx = userEvent.setup();

    renderWithProviders(<SearchPage />, { route: "/auth/search?q=zzz" });

    const addButton = await screen.findByRole("button", {
      name: "Add movie/series",
    });
    await userEventCtx.click(addButton);

    const nameInput = screen.getByPlaceholderText("Movie name");
    await userEventCtx.type(nameInput, "My Movie");
    await userEventCtx.click(
      screen.getByRole("button", { name: "Add to collection" })
    );

    await waitFor(() => {
      expect(screen.getByText("Movie added to your collection!")).toBeTruthy();
    });
    expect(api.createCustomMovie).toHaveBeenCalledWith({
      name: "My Movie",
      genreIds: [],
      year: null,
      runtimeMinutes: null,
    });
  });
});