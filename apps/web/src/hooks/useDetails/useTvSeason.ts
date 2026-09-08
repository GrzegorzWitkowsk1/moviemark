import { useQuery } from "@tanstack/react-query";
import type { TmdbSeasonDetails } from "shared";
import { getTvSeason, tmdbLanguage } from "@/lib/tmdb";

export function useTvSeason(
  id: number,
  seasonNumber: number,
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: ["tmdb", "tv", tmdbLanguage(), id, "season", seasonNumber],
    queryFn: () => getTvSeason(id, seasonNumber),
    enabled: options.enabled !== false && Number.isFinite(id) && seasonNumber > 0,
  });
}

export type { TmdbSeasonDetails };