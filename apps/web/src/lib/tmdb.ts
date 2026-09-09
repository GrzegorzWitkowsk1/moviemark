import type {
  GenreListResponse,
  HomeContent,
  TmdbListResult,
  TmdbMediaType,
  TmdbMovie,
  TmdbMovieDetails,
  TmdbSearchResult,
  TmdbSeasonDetails,
  TmdbTv,
  TmdbTvDetails,
} from "shared";
import i18n from "@/i18n";
import { apiFetch } from "./api";

export function tmdbLanguage(): string {
  return i18n.language === "pl" ? "pl-PL" : "en-US";
}

async function fetchTmdbJson<T>(path: string): Promise<T> {
  return apiFetch<T>(`/tmdb${path}`);
}

export function getNowPlayingMovies(): Promise<TmdbListResult<TmdbMovie>> {
  return fetchTmdbJson<TmdbListResult<TmdbMovie>>(
    `/movie/now_playing?language=${tmdbLanguage()}`
  );
}

export function getOnTheAirTv(): Promise<TmdbListResult<TmdbTv>> {
  return fetchTmdbJson<TmdbListResult<TmdbTv>>(
    `/tv/on_the_air?language=${tmdbLanguage()}`
  );
}

export function getUpcomingMovies(): Promise<TmdbListResult<TmdbMovie>> {
  return fetchTmdbJson<TmdbListResult<TmdbMovie>>(
    `/movie/upcoming?language=${tmdbLanguage()}`
  );
}

export function getTrending(
  mediaType: TmdbMediaType,
  timeWindow: "day" | "week"
): Promise<TmdbListResult<TmdbMovie | TmdbTv>> {
  return fetchTmdbJson<TmdbListResult<TmdbMovie | TmdbTv>>(
    `/trending/${mediaType}/${timeWindow}?language=${tmdbLanguage()}`
  );
}

export function getGenres(
  mediaType: TmdbMediaType
): Promise<GenreListResponse> {
  return fetchTmdbJson<GenreListResponse>(
    `/genre/${mediaType}/list?language=${tmdbLanguage()}`
  );
}

export function getMovieDetails(
  id: number,
  lang: string = tmdbLanguage()
): Promise<TmdbMovieDetails> {
  return fetchTmdbJson<TmdbMovieDetails>(`/movie/${id}?language=${lang}`);
}

export function getTvDetails(
  id: number,
  lang: string = tmdbLanguage()
): Promise<TmdbTvDetails> {
  return fetchTmdbJson<TmdbTvDetails>(`/tv/${id}?language=${lang}`);
}

export function getTvSeason(
  id: number,
  seasonNumber: number
): Promise<TmdbSeasonDetails> {
  return fetchTmdbJson<TmdbSeasonDetails>(
    `/tv/${id}/season/${seasonNumber}?language=${tmdbLanguage()}`
  );
}

export function getSimilarMovies(id: number): Promise<TmdbListResult<TmdbMovie>> {
  return fetchTmdbJson<TmdbListResult<TmdbMovie>>(
    `/movie/${id}/similar?language=${tmdbLanguage()}`
  );
}

export function getSimilarTv(id: number): Promise<TmdbListResult<TmdbTv>> {
  return fetchTmdbJson<TmdbListResult<TmdbTv>>(
    `/tv/${id}/similar?language=${tmdbLanguage()}`
  );
}

export function searchMulti(
  query: string
): Promise<TmdbSearchResult> {
  return fetchTmdbJson<TmdbSearchResult>(
    `/search/multi?query=${encodeURIComponent(query)}&language=${tmdbLanguage()}`
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