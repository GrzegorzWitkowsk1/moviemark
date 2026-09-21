import { useQuery } from "@tanstack/react-query";
import type { TmdbMovie, TmdbTv, TmdbSearchResult } from "shared";
import { searchMulti, tmdbLanguage } from "../tmdb/client";

function filterResults(data: TmdbSearchResult): (TmdbMovie | TmdbTv)[] {
  return data.results.filter(
    (item): item is TmdbMovie | TmdbTv =>
      "poster_path" in item && item.poster_path !== null
  );
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", tmdbLanguage(), query],
    queryFn: () => searchMulti(query),
    select: filterResults,
    enabled: query.trim().length > 0,
  });
}
