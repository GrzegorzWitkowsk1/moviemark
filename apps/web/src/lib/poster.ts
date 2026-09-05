const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";

export function getPosterUrl(path: string | null): string | null {
  if (!path) {
    return null;
  }
  return `${POSTER_BASE_URL}${path}`;
}
