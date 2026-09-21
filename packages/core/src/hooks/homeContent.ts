import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { HomeContent, TmdbMediaType } from "shared";
import { getGenres, getHomeContent, tmdbLanguage } from "../tmdb/client";

const homeContentKey = () => ["homeContent", tmdbLanguage()] as const;

export function useHomeContent() {
  return useQuery({
    queryKey: homeContentKey(),
    queryFn: getHomeContent,
  });
}

const selectNew = (data: HomeContent) => data.new;
const selectTrending = (data: HomeContent) => data.trending;
const selectUpcoming = (data: HomeContent) => data.upcoming.movies;

export function useNewContent() {
  return useQuery({
    queryKey: homeContentKey(),
    queryFn: getHomeContent,
    select: selectNew,
  });
}

export function useTrendingContent() {
  return useQuery({
    queryKey: homeContentKey(),
    queryFn: getHomeContent,
    select: selectTrending,
  });
}

export function useUpcomingMovies() {
  return useQuery({
    queryKey: homeContentKey(),
    queryFn: getHomeContent,
    select: selectUpcoming,
  });
}

export interface GenreMaps {
  movie: Record<number, string>;
  tv: Record<number, string>;
}

export const GENRES_STALE_TIME = 12 * 60 * 60 * 1000;

async function fetchAllGenres(): Promise<GenreMaps> {
  const [movie, tv] = await Promise.all([getGenres("movie"), getGenres("tv")]);

  const toMap = (
    genres: { id: number; name: string }[]
  ): Record<number, string> =>
    genres.reduce<Record<number, string>>((acc, genre) => {
      acc[genre.id] = genre.name;
      return acc;
    }, {});

  return {
    movie: toMap(movie.genres),
    tv: toMap(tv.genres),
  };
}

export function useGenres() {
  return useQuery({
    queryKey: ["genres", tmdbLanguage()],
    queryFn: fetchAllGenres,
    staleTime: GENRES_STALE_TIME,
  });
}

export function genreNames(
  genres: GenreMaps | undefined,
  mediaType: TmdbMediaType,
  genreIds: number[]
): string[] {
  const map = genres?.[mediaType];
  if (!map) {
    return [];
  }
  return genreIds
    .map((id) => map[id])
    .filter((name): name is string => name !== undefined);
}

export function useResolveGenres(
  mediaType: TmdbMediaType,
  genreIds: number[]
): string[] {
  const { data: genres, refetch } = useGenres();
  const refetchedFor = useRef<string | null>(null);

  const names = useMemo(
    () => genreNames(genres, mediaType, genreIds),
    [genres, mediaType, genreIds]
  );

  const missingKey = useMemo(() => {
    const map = genres?.[mediaType];
    if (!map) {
      return null;
    }
    const missing = genreIds.filter((id) => map[id] === undefined);
    return missing.length > 0 ? missing.join(",") : null;
  }, [genres, mediaType, genreIds]);

  useEffect(() => {
    if (missingKey && missingKey !== refetchedFor.current) {
      refetchedFor.current = missingKey;
      refetch();
    }
  }, [missingKey, refetch]);

  return names;
}
