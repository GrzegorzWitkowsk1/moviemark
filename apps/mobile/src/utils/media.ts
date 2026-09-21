import type {
  FutureMovieResponse,
  FutureSeriesResponse,
  TmdbMovie,
  TmdbTv,
  WatchedMovieResponse,
  WatchedSeriesResponse,
} from "shared";

export interface MediaItem {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
  genreIds?: number[];
  year?: string | null;
}

export function movieToItem(movie: TmdbMovie): MediaItem {
  return {
    id: movie.id,
    mediaType: "movie",
    title: movie.title,
    posterPath: movie.poster_path,
    genreIds: movie.genre_ids,
    year: movie.release_date,
  };
}

export function tvToItem(series: TmdbTv): MediaItem {
  return {
    id: series.id,
    mediaType: "tv",
    title: series.name,
    posterPath: series.poster_path,
    genreIds: series.genre_ids,
    year: series.first_air_date,
  };
}

export function searchResultToItem(item: TmdbMovie | TmdbTv): MediaItem {
  return "name" in item ? tvToItem(item) : movieToItem(item);
}

export function watchedToItem(
  item: WatchedMovieResponse | WatchedSeriesResponse
): MediaItem {
  return {
    id: item.tmdbId,
    mediaType: item.mediaType,
    title: item.mediaType === "tv" ? item.name : item.title,
    posterPath: item.posterPath,
    genreIds: item.genreIds,
    year: item.year,
  };
}

export function futureToItem(
  item: FutureMovieResponse | FutureSeriesResponse
): MediaItem {
  return {
    id: item.tmdbId,
    mediaType: item.mediaType,
    title: item.mediaType === "tv" ? item.name : item.title,
    posterPath: item.posterPath,
    genreIds: item.genreIds,
    year: item.year,
  };
}
