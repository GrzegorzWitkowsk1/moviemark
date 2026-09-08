import mongoose from "mongoose";
import type { Types } from "mongoose";

interface IFutureMovie {
  userId: Types.ObjectId;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  rating: number | null;
  addedAt: Date;
}

const FutureMovieSchema = new mongoose.Schema<IFutureMovie>(
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
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

FutureMovieSchema.index({ userId: 1, tmdbId: 1 }, { unique: true });

export const FutureMovie =
  (mongoose.models.FutureMovie as mongoose.Model<IFutureMovie>) ||
  mongoose.model<IFutureMovie>("FutureMovie", FutureMovieSchema);