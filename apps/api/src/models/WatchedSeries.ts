import mongoose from "mongoose";
import type { Types } from "mongoose";

export interface IWatchedSeries {
  userId: Types.ObjectId;
  tmdbId: number;
  name: string;
  posterPath: string | null;
  totalEpisodes: number;
  rating: number | null;
  watchedEpisodes: { season: number; episode: number }[];
  watchedAt: Date;
}

const WatchedSeriesSchema = new mongoose.Schema<IWatchedSeries>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tmdbId: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    posterPath: {
      type: String,
      default: null,
    },
    totalEpisodes: {
      type: Number,
      required: true,
      min: 0,
    },
    rating: {
      type: Number,
      default: null,
    },
    watchedEpisodes: {
      type: [
        {
          season: { type: Number, required: true },
          episode: { type: Number, required: true },
        },
      ],
      default: [],
    },
    watchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

WatchedSeriesSchema.index({ userId: 1, tmdbId: 1 }, { unique: true });

export const WatchedSeries =
  (mongoose.models.WatchedSeries as mongoose.Model<IWatchedSeries>) ||
  mongoose.model<IWatchedSeries>("WatchedSeries", WatchedSeriesSchema);
