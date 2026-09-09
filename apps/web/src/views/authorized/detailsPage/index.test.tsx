import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import type { CustomMovieResponse, TmdbMovieDetails } from "shared";
import DetailsPage from "./index";
import { renderWithProviders } from "@/test/utils";
import { server } from "@/test/server";
import { TMDB_BASE } from "@/test/handlers/tmdbHandlers";

const API = "http://localhost:3000";

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

function similarList(results: TmdbMovieDetails[] = []) {
  return {
    page: 1,
    total_pages: results.length === 0 ? 0 : 1,
    total_results: results.length,
    results,
  };
}

describe("DetailsPage", () => {
  it("shows a missing-id notice when no id is provided", () => {
    renderWithProviders(<DetailsPage />, { route: "/auth/movies" });

    expect(
      screen.getByText("Missing or invalid movie/series id.")
    ).toBeTruthy();
  });

  it("renders a movie with its hero meta and similar titles", async () => {
    server.use(
      http.get(`${TMDB_BASE}/movie/550`, () => HttpResponse.json(movie)),
      http.get(`${TMDB_BASE}/movie/550/similar`, () =>
        HttpResponse.json(similarList([similarMovie]))
      )
    );

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
    server.use(
      http.get(`${TMDB_BASE}/movie/550`, () => HttpResponse.json(movie)),
      http.get(`${TMDB_BASE}/movie/550/similar`, () =>
        HttpResponse.json(similarList())
      )
    );
    let lastAddBody: unknown;
    server.use(
      http.post(`${API}/collection/movie`, async ({ request }) => {
        lastAddBody = await request.json();
        return HttpResponse.json({ watched: true });
      })
    );
    const userEventCtx = userEvent.setup();

    renderWithProviders(<DetailsPage />, {
      route: "/auth/movies?id=550&type=movie",
    });

    const addButton = await screen.findByRole("button", {
      name: "Add to watched",
    });
    await userEventCtx.click(addButton);

    await waitFor(() => {
      expect(lastAddBody).toEqual({
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
    let lastAddBody: unknown;
    server.use(
      http.get(`${API}/custom/:id`, () => HttpResponse.json(customMovie)),
      http.post(`${API}/collection/movie`, async ({ request }) => {
        lastAddBody = await request.json();
        return HttpResponse.json({ watched: true });
      })
    );
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
      expect(lastAddBody).toEqual({
        tmdbId: -1,
        title: "My Movie",
        posterPath: null,
      });
    });
  });
});