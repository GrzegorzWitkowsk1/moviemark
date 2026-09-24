import type { Types } from "mongoose";
import { getTmdbDetails } from "../lib/tmdb";
import type { StatisticsResponse } from "shared";
import {
  findCustomMovie,
  findCustomSeries,
  findWatchedCollection,
  type WatchedMovieDoc,
  type WatchedSeriesDoc,
} from "../repositories/collection";

interface MovieMeta {
  runtime: number;
  genreIds: number[];
}

interface SeriesMeta {
  episodeRuntime: number;
  genreIds: number[];
}

function isCurrentYear(date: Date): boolean {
  return date.getFullYear() === new Date().getFullYear();
}

async function getMovieMeta(
  uid: Types.ObjectId,
  doc: WatchedMovieDoc
): Promise<MovieMeta> {
  if (doc.tmdbId < 0) {
    const custom = await findCustomMovie(uid, doc.tmdbId);
    return {
      runtime: custom?.runtimeMinutes ?? 0,
      genreIds: custom?.genreIds ?? [],
    };
  }
  const enrichment = await getTmdbDetails("movie", doc.tmdbId);
  return {
    runtime: enrichment?.runtime ?? 0,
    genreIds: enrichment?.genreIds ?? [],
  };
}

async function getSeriesMeta(
  uid: Types.ObjectId,
  doc: WatchedSeriesDoc
): Promise<SeriesMeta> {
  if (doc.tmdbId < 0) {
    const custom = await findCustomSeries(uid, doc.tmdbId);
    return {
      episodeRuntime: 0,
      genreIds: custom?.genreIds ?? [],
    };
  }
  const enrichment = await getTmdbDetails("tv", doc.tmdbId);
  return {
    episodeRuntime: enrichment?.episodeRunTime ?? 0,
    genreIds: enrichment?.genreIds ?? [],
  };
}

export async function getStatistics(
  uid: Types.ObjectId
): Promise<StatisticsResponse> {
  const [movies, series] = await findWatchedCollection(uid);

  const movieMetas = await Promise.all(movies.map((doc) => getMovieMeta(uid, doc)));
  const seriesMetas = await Promise.all(series.map((doc) => getSeriesMeta(uid, doc)));

  let movieWatchtimeMinutes = 0;
  let seriesWatchtimeMinutes = 0;
  let moviesWatchedInYear = 0;
  let seriesWatchedInYear = 0;
  let watchtimeMinutesInYear = 0;

  movies.forEach((doc, index) => {
    const runtime = movieMetas[index]!.runtime;
    movieWatchtimeMinutes += runtime;
    if (isCurrentYear(doc.watchedAt)) {
      moviesWatchedInYear += 1;
      watchtimeMinutesInYear += runtime;
    }
  });

  series.forEach((doc, index) => {
    const episodeRuntime = seriesMetas[index]!.episodeRuntime;
    const runtime = doc.watchedEpisodes.length * episodeRuntime;
    seriesWatchtimeMinutes += runtime;
    if (isCurrentYear(doc.watchedAt)) {
      seriesWatchedInYear += 1;
      watchtimeMinutesInYear += runtime;
    }
  });

  const genreCounts = new Map<number, number>();
  const bump = (genreIds: number[]) => {
    for (const genreId of genreIds) {
      genreCounts.set(genreId, (genreCounts.get(genreId) ?? 0) + 1);
    }
  };
  movieMetas.forEach((meta) => bump(meta.genreIds));
  seriesMetas.forEach((meta) => bump(meta.genreIds));

  const favouriteGenres = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, 4)
    .map(([genreId, count]) => ({ genreId, count }));

  return {
    watchedMovies: movies.length,
    watchedSeries: series.length,
    watchedEpisodes: series.reduce(
      (sum, doc) => sum + doc.watchedEpisodes.length,
      0
    ),
    movieWatchtimeMinutes,
    seriesWatchtimeMinutes,
    moviesWatchedInYear,
    seriesWatchedInYear,
    watchtimeMinutesInYear,
    favouriteGenres,
    totalMovies: movies.length,
    fullSeriesWatched: series.filter(
      (doc) =>
        doc.totalEpisodes > 0 && doc.watchedEpisodes.length >= doc.totalEpisodes
    ).length,
  };
}