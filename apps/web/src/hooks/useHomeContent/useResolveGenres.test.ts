import { describe, expect, it } from "vitest";
import { waitFor } from "@testing-library/react";
import { genreNames, useResolveGenres } from "./useResolveGenres";
import { renderHookWithProviders } from "@/test/utils";

const movieGenres = { 28: "Action", 12: "Adventure", 878: "Science Fiction" };
const tvGenres = { 10765: "Sci-Fi & Fantasy", 18: "Drama" };

const genreMaps = {
  movie: movieGenres,
  tv: tvGenres,
} as const;

describe("genreNames", () => {
  it("returns empty when there is no genre map", () => {
    expect(genreNames(undefined, "movie", [28])).toEqual([]);
  });

  it("maps genre ids to names for the given media type", () => {
    expect(genreNames(genreMaps, "movie", [28, 12])).toEqual([
      "Action",
      "Adventure",
    ]);
  });

  it("filters out unknown genre ids", () => {
    expect(genreNames(genreMaps, "tv", [18, 999])).toEqual(["Drama"]);
  });

  it("does not mix genres across media types", () => {
    expect(genreNames(genreMaps, "movie", [10765])).toEqual([]);
  });

  it("preserves the requested order", () => {
    expect(genreNames(genreMaps, "movie", [12, 28])).toEqual([
      "Adventure",
      "Action",
    ]);
  });
});

describe("useResolveGenres", () => {
  it("returns resolved genre names from the cache", async () => {
    const { result } = renderHookWithProviders(() =>
      useResolveGenres("movie", [28, 12])
    );

    await waitFor(() => {
      expect(result.current).toEqual(["Action", "Adventure"]);
    });
  });
});
