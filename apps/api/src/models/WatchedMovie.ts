import mongoose from "mongoose";
import type { Types } from "mongoose";

interface IWatchedMovie {
  userId: Types.ObjectId;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  rating: number | null;
  watchedAt: Date;
}

const WatchedMovieSchema = new mongoose.Schema<IWatchedMovie>(
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
    title: {
      type: String,
      required: true,
    },
    posterPath: {
      type: String,
      default: null,
    },
    rating: {
      type: Number,
      default: null,
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

WatchedMovieSchema.index({ userId: 1, tmdbId: 1 }, { unique: true });

export const WatchedMovie =
  (mongoose.models.WatchedMovie as mongoose.Model<IWatchedMovie>) ||
  mongoose.model<IWatchedMovie>("WatchedMovie", WatchedMovieSchema);
