const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export function getImageUrl(path: string | null, size: string): string | null {
  if (!path) {
    return null;
  }
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

export function getPosterUrl(path: string | null): string | null {
  return getImageUrl(path, "w500");
}

export function getBackdropUrl(path: string | null): string | null {
  return getImageUrl(path, "w1280");
}

export function getStillUrl(path: string | null): string | null {
  return getImageUrl(path, "w300");
}