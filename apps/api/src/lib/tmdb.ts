import type { TmdbMediaType } from "shared";
import { config } from "../config";

interface TmdbDetailsResult {
  rating: number;
  voteCount: number;
  overview: string;
  year: string | null;
  genreIds: number[];
}

const suggestTimeoutMs = 3000;

function tmdbToken(): string {
  return Bun.env.TMDB_TOKEN ?? config.tmdbToken;
}

export function buildTmdbUrl(queryPath: string): string | null {
  const token = tmdbToken();
  if (!token) {
    return null;
  }
  const isJwt = token.startsWith("eyJ");
  const separator = queryPath.includes("?") ? "&" : "?";
  return isJwt
    ? `${config.tmdbApiBase}${queryPath}`
    : `${config.tmdbApiBase}${queryPath}${separator}api_key=${token}`;
}

export function tmdbRequestHeaders(): Record<string, string> {
  const token = tmdbToken();
  const isJwt = token?.startsWith("eyJ");
  return isJwt ? { Authorization: `Bearer ${token}` } : {};
}

export async function getTmdbDetails(
  mediaType: TmdbMediaType,
  tmdbId: number
): Promise<TmdbDetailsResult | null> {
  if (!tmdbToken()) {
    return null;
  }

  const path = `/${mediaType}/${tmdbId}?language=en-US`;
  const url = buildTmdbUrl(path);
  if (!url) {
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), suggestTimeoutMs);

  try {
    const res = await fetch(url, {
      headers: tmdbRequestHeaders(),
      signal: controller.signal,
    });
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as {
      vote_average?: number;
      vote_count?: number;
      overview?: string;
      release_date?: string;
      first_air_date?: string;
      genre_ids?: number[];
      genres?: { id: number }[];
    };

    const dateField =
      mediaType === "movie" ? data.release_date : data.first_air_date;

    return {
      rating: data.vote_average ?? 0,
      voteCount: data.vote_count ?? 0,
      overview: data.overview ?? "",
      year: dateField ? dateField.slice(0, 4) : null,
      genreIds: (data.genre_ids ?? data.genres?.map((g) => g.id) ?? []).slice(
        0
      ),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
