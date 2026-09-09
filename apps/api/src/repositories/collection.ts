import type { HydratedDocument, Types } from "mongoose";
import { WatchedMovie } from "../models/WatchedMovie";
import { WatchedSeries } from "../models/WatchedSeries";
import { CustomMovie } from "../models/CustomMovie";
import { CustomSeries } from "../models/CustomSeries";
import type { IWatchedMovie } from "../models/WatchedMovie";
import type { IWatchedSeries } from "../models/WatchedSeries";

export type WatchedMovieDoc = HydratedDocument<IWatchedMovie>;
export type WatchedSeriesDoc = HydratedDocument<IWatchedSeries>;

export function findWatchedMovie(
  uid: Types.ObjectId,
  tmdbId: number
): Promise<WatchedMovieDoc | null> {
  return WatchedMovie.findOne({ userId: uid, tmdbId });
}

export function createWatchedMovie(
  uid: Types.ObjectId,
  data: {
    tmdbId: number;
    title: string;
    posterPath: string | null;
    rating: number | null;
  }
): Promise<WatchedMovieDoc> {
  return WatchedMovie.create({ userId: uid, ...data });
}

export async function deleteWatchedMovie(
  uid: Types.ObjectId,
  tmdbId: number
): Promise<void> {
  await WatchedMovie.findOneAndDelete({ userId: uid, tmdbId });
}

export function findWatchedSeries(
  uid: Types.ObjectId,
  tmdbId: number
): Promise<WatchedSeriesDoc | null> {
  return WatchedSeries.findOne({ userId: uid, tmdbId });
}

export function createWatchedSeries(
  uid: Types.ObjectId,
  data: {
    tmdbId: number;
    name: string;
    posterPath: string | null;
    totalEpisodes: number;
    rating: number | null;
    watchedEpisodes: { season: number; episode: number }[];
  }
): Promise<WatchedSeriesDoc> {
  return WatchedSeries.create({ userId: uid, ...data });
}

export async function deleteWatchedSeries(
  uid: Types.ObjectId,
  tmdbId: number
): Promise<void> {
  await WatchedSeries.deleteOne({ userId: uid, tmdbId });
}

export async function deleteWatchedSeriesById(id: Types.ObjectId): Promise<void> {
  await WatchedSeries.deleteOne({ _id: id });
}

export function saveWatchedSeries(doc: WatchedSeriesDoc): Promise<WatchedSeriesDoc> {
  return doc.save();
}

export async function findWatchedCollection(
  uid: Types.ObjectId
): Promise<[WatchedMovieDoc[], WatchedSeriesDoc[]]> {
  return Promise.all([
    WatchedMovie.find({ userId: uid }),
    WatchedSeries.find({ userId: uid }),
  ]);
}

export async function findCustomMovie(
  uid: Types.ObjectId,
  customId: number
): Promise<{ year: string | null; genreIds: number[] } | null> {
  return CustomMovie.findOne(
    { userId: uid, customId },
    { year: 1, genreIds: 1, _id: 0 }
  );
}

export async function findCustomSeries(
  uid: Types.ObjectId,
  customId: number
): Promise<{ year: string | null; genreIds: number[] } | null> {
  return CustomSeries.findOne(
    { userId: uid, customId },
    { year: 1, genreIds: 1, _id: 0 }
  );
}