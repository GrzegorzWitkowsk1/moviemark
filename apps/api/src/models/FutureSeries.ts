import mongoose from "mongoose";
import type { Types } from "mongoose";

export interface IFutureSeries {
  userId: Types.ObjectId;
  tmdbId: number;
  name: string;
  posterPath: string | null;
  rating: number | null;
  addedAt: Date;
}

const FutureSeriesSchema = new mongoose.Schema<IFutureSeries>(
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

FutureSeriesSchema.index({ userId: 1, tmdbId: 1 }, { unique: true });

export const FutureSeries =
  (mongoose.models.FutureSeries as mongoose.Model<IFutureSeries>) ||
  mongoose.model<IFutureSeries>("FutureSeries", FutureSeriesSchema);