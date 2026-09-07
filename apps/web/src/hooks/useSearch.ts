import { useQuery } from "@tanstack/react-query";
import { searchMulti } from "@/lib/tmdb";
import type { TmdbMovie, TmdbTv, TmdbSearchResult } from "shared";

function filterResults(data: TmdbSearchResult): (TmdbMovie | TmdbTv)[] {
  return data.results.filter(
    (item): item is TmdbMovie | TmdbTv =>
      "poster_path" in item && item.poster_path !== null
  );
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => searchMulti(query),
    select: filterResults,
    enabled: query.trim().length > 0,
  });
}
