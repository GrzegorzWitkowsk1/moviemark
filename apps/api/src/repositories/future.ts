import type { HydratedDocument, Types } from "mongoose";
import { FutureMovie } from "../models/FutureMovie";
import { FutureSeries } from "../models/FutureSeries";
import type { IFutureMovie } from "../models/FutureMovie";
import type { IFutureSeries } from "../models/FutureSeries";

export type FutureMovieDoc = HydratedDocument<IFutureMovie>;
export type FutureSeriesDoc = HydratedDocument<IFutureSeries>;

export function findFutureMovie(
  uid: Types.ObjectId,
  tmdbId: number
): Promise<FutureMovieDoc | null> {
  return FutureMovie.findOne({ userId: uid, tmdbId });
}

export function createFutureMovie(
  uid: Types.ObjectId,
  data: {
    tmdbId: number;
    title: string;
    posterPath: string | null;
    rating: number | null;
  }
): Promise<FutureMovieDoc> {
  return FutureMovie.create({ userId: uid, ...data });
}

export async function deleteFutureMovie(
  uid: Types.ObjectId,
  tmdbId: number
): Promise<void> {
  await FutureMovie.findOneAndDelete({ userId: uid, tmdbId });
}

export function findFutureSeries(
  uid: Types.ObjectId,
  tmdbId: number
): Promise<FutureSeriesDoc | null> {
  return FutureSeries.findOne({ userId: uid, tmdbId });
}

export function createFutureSeries(
  uid: Types.ObjectId,
  data: {
    tmdbId: number;
    name: string;
    posterPath: string | null;
    rating: number | null;
  }
): Promise<FutureSeriesDoc> {
  return FutureSeries.create({ userId: uid, ...data });
}

export async function deleteFutureSeries(
  uid: Types.ObjectId,
  tmdbId: number
): Promise<void> {
  await FutureSeries.findOneAndDelete({ userId: uid, tmdbId });
}

export async function findFutureList(
  uid: Types.ObjectId
): Promise<[FutureMovieDoc[], FutureSeriesDoc[]]> {
  return Promise.all([
    FutureMovie.find({ userId: uid }),
    FutureSeries.find({ userId: uid }),
  ]);
}