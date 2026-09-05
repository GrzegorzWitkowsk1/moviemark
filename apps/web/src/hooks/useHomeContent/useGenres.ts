import { useQuery } from "@tanstack/react-query";
import { getGenres } from "@/lib/tmdb";

export interface GenreMaps {
  movie: Record<number, string>;
  tv: Record<number, string>;
}

export const GENRES_STALE_TIME = 12 * 60 * 60 * 1000;

async function fetchAllGenres(): Promise<GenreMaps> {
  const [movie, tv] = await Promise.all([
    getGenres("movie"),
    getGenres("tv"),
  ]);

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
    queryKey: ["genres"],
    queryFn: fetchAllGenres,
    staleTime: GENRES_STALE_TIME,
  });
}