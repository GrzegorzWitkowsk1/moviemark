import { useQuery } from "@tanstack/react-query";
import type {
  TmdbListResult,
  TmdbMovie,
  TmdbMovieDetails,
  TmdbTv,
  TmdbTvDetails,
} from "shared";
import {
  getMovieDetails,
  getSimilarMovies,
  getSimilarTv,
  getTvDetails,
  tmdbLanguage,
} from "@/lib/tmdb";

export function useMovieDetails(id: number) {
  return useQuery({
    queryKey: ["tmdb", "movie", "details", tmdbLanguage(), id],
    queryFn: async () => {
      if (tmdbLanguage() === "en-US") {
        return getMovieDetails(id);
      }
      const localized = await getMovieDetails(id);
      if (localized.overview?.trim()) {
        return localized;
      }
      const en = await getMovieDetails(id, "en-US");
      return { ...localized, overview: en.overview ?? "" };
    },
    enabled: Number.isFinite(id),
  });
}

export function useTvDetails(id: number) {
  return useQuery({
    queryKey: ["tmdb", "tv", "details", tmdbLanguage(), id],
    queryFn: async () => {
      if (tmdbLanguage() === "en-US") {
        return getTvDetails(id);
      }
      const localized = await getTvDetails(id);
      if (localized.overview?.trim()) {
        return localized;
      }
      const en = await getTvDetails(id, "en-US");
      return { ...localized, overview: en.overview ?? "" };
    },
    enabled: Number.isFinite(id),
  });
}

export function useSimilarMovies(id: number) {
  return useQuery({
    queryKey: ["tmdb", "movie", tmdbLanguage(), id, "similar"],
    queryFn: () => getSimilarMovies(id),
    enabled: Number.isFinite(id),
  });
}

export function useSimilarTv(id: number) {
  return useQuery({
    queryKey: ["tmdb", "tv", tmdbLanguage(), id, "similar"],
    queryFn: () => getSimilarTv(id),
    enabled: Number.isFinite(id),
  });
}

export type { TmdbMovieDetails, TmdbTvDetails, TmdbListResult, TmdbMovie, TmdbTv };