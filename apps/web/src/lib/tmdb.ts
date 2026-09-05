import type {
  GenreListResponse,
  HomeContent,
  TmdbListResult,
  TmdbMediaType,
  TmdbMovie,
  TmdbTv,
} from "shared";
import { config } from "./config";

async function fetchTmdbJson<T>(path: string): Promise<T> {
  if (!config.tmdbToken) {
    throw new Error("Missing VITE_TMDB_TOKEN.");
  }

  const isJwt = config.tmdbToken.startsWith("eyJ");
  const separator = path.includes("?") ? "&" : "?";
  const url = isJwt
    ? `${config.tmdbApiBase}${path}`
    : `${config.tmdbApiBase}${path}${separator}api_key=${config.tmdbToken}`;
  const headers: Record<string, string> = isJwt
    ? { Authorization: `Bearer ${config.tmdbToken}` }
    : {};

  const res = await fetch(url, { headers });

  if (!res.ok) {
    throw new Error(`TMDB request failed (${res.status}) for ${path}.`);
  }

  return (await res.json()) as T;
}

export function getNowPlayingMovies(): Promise<TmdbListResult<TmdbMovie>> {
  return fetchTmdbJson<TmdbListResult<TmdbMovie>>(
    "/movie/now_playing?language=en-US"
  );
}

export function getOnTheAirTv(): Promise<TmdbListResult<TmdbTv>> {
  return fetchTmdbJson<TmdbListResult<TmdbTv>>("/tv/on_the_air?language=en-US");
}

export function getUpcomingMovies(): Promise<TmdbListResult<TmdbMovie>> {
  return fetchTmdbJson<TmdbListResult<TmdbMovie>>(
    "/movie/upcoming?language=en-US"
  );
}

export function getTrending(
  mediaType: TmdbMediaType,
  timeWindow: "day" | "week"
): Promise<TmdbListResult<TmdbMovie | TmdbTv>> {
  return fetchTmdbJson<TmdbListResult<TmdbMovie | TmdbTv>>(
    `/trending/${mediaType}/${timeWindow}?language=en-US`
  );
}

export function getGenres(
  mediaType: TmdbMediaType
): Promise<GenreListResponse> {
  return fetchTmdbJson<GenreListResponse>(
    `/genre/${mediaType}/list?language=en-US`
  );
}

export async function getHomeContent(): Promise<HomeContent> {
  const [nowPlaying, onTheAir, upcoming, trendingMovies, trendingTv] =
    await Promise.all([
      getNowPlayingMovies(),
      getOnTheAirTv(),
      getUpcomingMovies(),
      getTrending("movie", "day"),
      getTrending("tv", "day"),
    ]);

  return {
    new: {
      movies: nowPlaying.results,
      series: onTheAir.results,
    },
    upcoming: {
      movies: upcoming.results,
    },
    trending: {
      movies: trendingMovies.results as TmdbMovie[],
      series: trendingTv.results as TmdbTv[],
    },
  };
}