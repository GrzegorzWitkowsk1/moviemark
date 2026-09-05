import { useEffect, useMemo, useRef } from "react";
import type { TmdbMediaType } from "shared";
import type { GenreMaps } from "./useGenres";
import { useGenres } from "./useGenres";

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