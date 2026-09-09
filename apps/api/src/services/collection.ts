import type { Types } from "mongoose";
import { getTmdbDetails, type TmdbDetailsResult } from "../lib/tmdb";
import type {
  AddMovieRequest,
  CollectionResponse,
  MarkEpisodesRequest,
  MovieStatusResponse,
  SeriesStatusResponse,
  WatchedMovieResponse,
  WatchedSeriesResponse,
} from "shared";
import {
  createWatchedMovie,
  createWatchedSeries,
  deleteWatchedMovie,
  deleteWatchedSeries,
  deleteWatchedSeriesById,
  findCustomMovie,
  findCustomSeries,
  findWatchedCollection,
  findWatchedMovie,
  findWatchedSeries,
  saveWatchedSeries,
  type WatchedMovieDoc,
  type WatchedSeriesDoc,
} from "../repositories/collection";

function conflict(message: string): never {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = 409;
  throw err;
}

function toPlainEpisodes(episodes: { season: number; episode: number }[]) {
  return episodes.map(({ season, episode }) => ({ season, episode }));
}

function toMovieResponse(
  doc: WatchedMovieDoc,
  enrichment?: TmdbDetailsResult | null
): WatchedMovieResponse {
  return {
    tmdbId: doc.tmdbId,
    title: doc.title,
    posterPath: doc.posterPath,
    watchedAt: doc.watchedAt.toISOString(),
    mediaType: "movie",
    rating: doc.rating ?? enrichment?.rating,
    ...(enrichment
      ? {
          voteCount: enrichment.voteCount,
          overview: enrichment.overview,
          year: enrichment.year,
          genreIds: enrichment.genreIds,
        }
      : {}),
  };
}

function toSeriesResponse(
  doc: WatchedSeriesDoc,
  enrichment?: TmdbDetailsResult | null
): WatchedSeriesResponse {
  return {
    tmdbId: doc.tmdbId,
    name: doc.name,
    posterPath: doc.posterPath,
    totalEpisodes: doc.totalEpisodes,
    watchedCount: doc.watchedEpisodes.length,
    watchedEpisodes: toPlainEpisodes(doc.watchedEpisodes),
    watchedAt: doc.watchedAt.toISOString(),
    mediaType: "tv",
    rating: doc.rating ?? enrichment?.rating,
    ...(enrichment
      ? {
          voteCount: enrichment.voteCount,
          overview: enrichment.overview,
          year: enrichment.year,
          genreIds: enrichment.genreIds,
        }
      : {}),
  };
}

function toSeriesStatusResponse(doc: WatchedSeriesDoc): SeriesStatusResponse {
  return {
    watched: true,
    watchedCount: doc.watchedEpisodes.length,
    totalEpisodes: doc.totalEpisodes,
    watchedEpisodes: toPlainEpisodes(doc.watchedEpisodes),
  };
}

function emptySeriesStatus(): SeriesStatusResponse {
  return {
    watched: false,
    watchedCount: 0,
    totalEpisodes: 0,
    watchedEpisodes: [],
  };
}

export async function getMovieStatus(
  uid: Types.ObjectId,
  tmdbId: number
): Promise<MovieStatusResponse> {
  const doc = await findWatchedMovie(uid, tmdbId);
  return { watched: !!doc };
}

export async function addMovie(
  uid: Types.ObjectId,
  body: AddMovieRequest
): Promise<MovieStatusResponse> {
  const { tmdbId, title, posterPath, rating } = body;
  const existing = await findWatchedMovie(uid, tmdbId);
  if (existing) {
    conflict("error.collection.movieAlreadyAdded");
  }
  await createWatchedMovie(uid, {
    tmdbId,
    title,
    posterPath: posterPath ?? null,
    rating: rating ?? null,
  });
  return { watched: true };
}

export async function removeMovie(
  uid: Types.ObjectId,
  tmdbId: number
): Promise<MovieStatusResponse> {
  await deleteWatchedMovie(uid, tmdbId);
  return { watched: false };
}

export async function getSeriesStatus(
  uid: Types.ObjectId,
  tmdbId: number
): Promise<SeriesStatusResponse> {
  const doc = await findWatchedSeries(uid, tmdbId);
  return doc ? toSeriesStatusResponse(doc) : emptySeriesStatus();
}

export async function markEpisodes(
  uid: Types.ObjectId,
  body: MarkEpisodesRequest
): Promise<SeriesStatusResponse> {
  const { tmdbId, season, episodes, name, posterPath, totalEpisodes, rating } =
    body;

  let doc = await findWatchedSeries(uid, tmdbId);

  if (!doc) {
    doc = await createWatchedSeries(uid, {
      tmdbId,
      name,
      posterPath: posterPath ?? null,
      totalEpisodes,
      rating: rating ?? null,
      watchedEpisodes: episodes.map((episode) => ({ season, episode })),
    });
  } else {
    for (const episode of episodes) {
      const already = doc.watchedEpisodes.some(
        (e) => e.season === season && e.episode === episode
      );
      if (!already) {
        doc.watchedEpisodes.push({ season, episode });
      }
    }
    doc.totalEpisodes = totalEpisodes;
    doc.rating = rating ?? doc.rating;
    doc.watchedAt = new Date();
    doc = await saveWatchedSeries(doc);
  }

  return toSeriesStatusResponse(doc);
}

export async function uncheckEpisode(
  uid: Types.ObjectId,
  tmdbId: number,
  season: number,
  episode: number
): Promise<SeriesStatusResponse> {
  const doc = await findWatchedSeries(uid, tmdbId);
  if (!doc) {
    return emptySeriesStatus();
  }

  doc.watchedEpisodes = doc.watchedEpisodes.filter(
    (e) => e.season !== season || e.episode !== episode
  );

  if (doc.watchedEpisodes.length === 0) {
    await deleteWatchedSeriesById(doc._id);
    return emptySeriesStatus();
  }

  doc.watchedAt = new Date();
  const saved = await saveWatchedSeries(doc);
  return toSeriesStatusResponse(saved);
}

export async function removeSeries(
  uid: Types.ObjectId,
  tmdbId: number
): Promise<MovieStatusResponse> {
  await deleteWatchedSeries(uid, tmdbId);
  return { watched: false };
}

export async function getCollection(uid: Types.ObjectId): Promise<CollectionResponse> {
  const [movies, series] = await findWatchedCollection(uid);

  const movieEnrichments = await Promise.all(
    movies.map((doc) =>
      doc.tmdbId < 0
        ? findCustomMovie(uid, doc.tmdbId).then((custom) =>
            custom
              ? {
                  rating: 0,
                  voteCount: 0,
                  overview: "",
                  year: custom.year,
                  genreIds: custom.genreIds,
                }
              : null
          )
        : getTmdbDetails("movie", doc.tmdbId)
    )
  );
  const seriesEnrichments = await Promise.all(
    series.map((doc) =>
      doc.tmdbId < 0
        ? findCustomSeries(uid, doc.tmdbId).then((custom) =>
            custom
              ? {
                  rating: 0,
                  voteCount: 0,
                  overview: "",
                  year: custom.year,
                  genreIds: custom.genreIds,
                }
              : null
          )
        : getTmdbDetails("tv", doc.tmdbId)
    )
  );

  return {
    movies: movies.map((doc, index) =>
      toMovieResponse(doc, movieEnrichments[index])
    ),
    series: series.map((doc, index) =>
      toSeriesResponse(doc, seriesEnrichments[index])
    ),
  };
}