import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import SectionCarousel from "./SectionCarousel";
import type { TmdbMovie, TmdbTv } from "shared";
import { renderWithProviders } from "@/test/utils";

const tmdb = vi.hoisted(() => ({ getGenres: vi.fn(), tmdbLanguage: vi.fn() }));
vi.mock("@/lib/tmdb", () => tmdb);

const movies: TmdbMovie[] = [
  {
    adult: false,
    backdrop_path: null,
    id: 550,
    title: "Fight Club",
    original_language: "en",
    original_title: "Fight Club",
    overview: "Insomnia",
    popularity: 100,
    release_date: "1999-10-15",
    video: false,
    vote_count: 25000,
    poster_path: "/fc.jpg",
    vote_average: 8.4,
    genre_ids: [28],
  },
  {
    adult: false,
    backdrop_path: null,
    id: 155,
    title: "The Dark Knight",
    original_language: "en",
    original_title: "The Dark Knight",
    overview: "Batman",
    popularity: 200,
    release_date: "2008-07-18",
    video: false,
    vote_count: 30000,
    poster_path: "/dk.jpg",
    vote_average: 9.0,
    genre_ids: [28],
  },
];

const series: TmdbTv[] = [
  {
    adult: false,
    backdrop_path: null,
    id: 1396,
    name: "Breaking Bad",
    origin_country: ["US"],
    original_language: "en",
    original_name: "Breaking Bad",
    first_air_date: "2008-01-20",
    overview: "Chemistry",
    popularity: 150,
    vote_count: 12000,
    poster_path: "/bb.jpg",
    vote_average: 9.5,
    genre_ids: [18],
  },
];

beforeEach(() => {
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

describe("SectionCarousel", () => {
  it("renders nothing when every list is empty", () => {
    renderWithProviders(<SectionCarousel title="Similar" movies={[]} series={[]} />);
    expect(screen.queryByText("Similar")).toBeNull();
  });

  it("renders movies when they arrive after mount", async () => {
    const { rerender } = renderWithProviders(
      <SectionCarousel title="Similar" movies={[]} />
    );
    expect(screen.queryByText("Fight Club")).toBeNull();

    rerender(<SectionCarousel title="Similar" movies={movies} />);

    await waitFor(() => expect(screen.getByText("Fight Club")).toBeTruthy());
    expect(screen.queryByText("Breaking Bad")).toBeNull();
    expect(screen.queryByText("Series")).toBeNull();
  });

  it("switches between movies and series via the toggle", async () => {
    renderWithProviders(<SectionCarousel title="Top" movies={movies} series={series} />);

    await waitFor(() => expect(screen.getByText("Fight Club")).toBeTruthy());

    fireEvent.click(screen.getByText("Series"));
    await waitFor(() => expect(screen.getByText("Breaking Bad")).toBeTruthy());
    expect(screen.queryByText("Fight Club")).toBeNull();

    fireEvent.click(screen.getByText("Movies"));
    await waitFor(() => expect(screen.getByText("Fight Club")).toBeTruthy());
    expect(screen.queryByText("Breaking Bad")).toBeNull();
  });

  it("adds the toggle when series arrive after movies already rendered", async () => {
    const { rerender } = renderWithProviders(
      <SectionCarousel title="Top" movies={movies} />
    );
    await waitFor(() => expect(screen.getByText("Fight Club")).toBeTruthy());
    expect(screen.queryByText("Series")).toBeNull();

    rerender(<SectionCarousel title="Top" movies={movies} series={series} />);

    await waitFor(() => expect(screen.getByText("Series")).toBeTruthy());
    expect(screen.getByText("Fight Club")).toBeTruthy();
  });
});