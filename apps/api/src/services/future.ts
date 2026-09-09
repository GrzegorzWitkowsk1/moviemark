import type { Types } from "mongoose";
import { getTmdbDetails, type TmdbDetailsResult } from "../lib/tmdb";
import type {
  AddFutureMovieRequest,
  AddFutureSeriesRequest,
  FutureListResponse,
  FutureMovieResponse,
  FutureSeriesResponse,
  FutureStatusResponse,
} from "shared";
import {
  createFutureMovie,
  createFutureSeries,
  deleteFutureMovie,
  deleteFutureSeries,
  findFutureList,
  findFutureMovie,
  findFutureSeries,
  type FutureMovieDoc,
  type FutureSeriesDoc,
} from "../repositories/future";

function conflict(message: string): never {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = 409;
  throw err;
}

function toMovieResponse(
  doc: FutureMovieDoc,
  enrichment?: TmdbDetailsResult | null
): FutureMovieResponse {
  return {
    tmdbId: doc.tmdbId,
    title: doc.title,
    posterPath: doc.posterPath,
    addedAt: doc.addedAt.toISOString(),
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
  doc: FutureSeriesDoc,
  enrichment?: TmdbDetailsResult | null
): FutureSeriesResponse {
  return {
    tmdbId: doc.tmdbId,
    name: doc.name,
    posterPath: doc.posterPath,
    addedAt: doc.addedAt.toISOString(),
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

export async function getMovieStatus(
  uid: Types.ObjectId,
  tmdbId: number
): Promise<FutureStatusResponse> {
  const doc = await findFutureMovie(uid, tmdbId);
  return { wanted: !!doc };
}

export async function addMovie(
  uid: Types.ObjectId,
  body: AddFutureMovieRequest
): Promise<FutureStatusResponse> {
  const { tmdbId, title, posterPath, rating } = body;
  const existing = await findFutureMovie(uid, tmdbId);
  if (existing) {
    conflict("error.future.movieAlreadyAdded");
  }
  await createFutureMovie(uid, {
    tmdbId,
    title,
    posterPath: posterPath ?? null,
    rating: rating ?? null,
  });
  return { wanted: true };
}

export async function removeMovie(
  uid: Types.ObjectId,
  tmdbId: number
): Promise<FutureStatusResponse> {
  await deleteFutureMovie(uid, tmdbId);
  return { wanted: false };
}

export async function getSeriesStatus(
  uid: Types.ObjectId,
  tmdbId: number
): Promise<FutureStatusResponse> {
  const doc = await findFutureSeries(uid, tmdbId);
  return { wanted: !!doc };
}

export async function addSeries(
  uid: Types.ObjectId,
  body: AddFutureSeriesRequest
): Promise<FutureStatusResponse> {
  const { tmdbId, name, posterPath, rating } = body;
  const existing = await findFutureSeries(uid, tmdbId);
  if (existing) {
    conflict("error.future.seriesAlreadyAdded");
  }
  await createFutureSeries(uid, {
    tmdbId,
    name,
    posterPath: posterPath ?? null,
    rating: rating ?? null,
  });
  return { wanted: true };
}

export async function removeSeries(
  uid: Types.ObjectId,
  tmdbId: number
): Promise<FutureStatusResponse> {
  await deleteFutureSeries(uid, tmdbId);
  return { wanted: false };
}

export async function getFutureList(uid: Types.ObjectId): Promise<FutureListResponse> {
  const [movies, series] = await findFutureList(uid);

  const movieEnrichments = await Promise.all(
    movies.map((doc) => getTmdbDetails("movie", doc.tmdbId))
  );
  const seriesEnrichments = await Promise.all(
    series.map((doc) => getTmdbDetails("tv", doc.tmdbId))
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