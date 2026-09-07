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
} from "@/lib/tmdb";

export function useMovieDetails(id: number) {
  return useQuery({
    queryKey: ["tmdb", "movie", "details", id],
    queryFn: () => getMovieDetails(id),
    enabled: Number.isFinite(id),
  });
}

export function useTvDetails(id: number) {
  return useQuery({
    queryKey: ["tmdb", "tv", "details", id],
    queryFn: () => getTvDetails(id),
    enabled: Number.isFinite(id),
  });
}

export function useSimilarMovies(id: number) {
  return useQuery({
    queryKey: ["tmdb", "movie", id, "similar"],
    queryFn: () => getSimilarMovies(id),
    enabled: Number.isFinite(id),
  });
}

export function useSimilarTv(id: number) {
  return useQuery({
    queryKey: ["tmdb", "tv", id, "similar"],
    queryFn: () => getSimilarTv(id),
    enabled: Number.isFinite(id),
  });
}

export type { TmdbMovieDetails, TmdbTvDetails, TmdbListResult, TmdbMovie, TmdbTv };