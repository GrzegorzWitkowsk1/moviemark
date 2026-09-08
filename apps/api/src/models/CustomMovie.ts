import mongoose from "mongoose";
import type { Types } from "mongoose";

interface ICustomMovie {
  userId: Types.ObjectId;
  customId: number;
  name: string;
  genreIds: number[];
  year: string | null;
  runtimeMinutes: number | null;
  watchedAt: Date;
}

const CustomMovieSchema = new mongoose.Schema<ICustomMovie>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customId: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    genreIds: {
      type: [Number],
      default: [],
    },
    year: {
      type: String,
      default: null,
    },
    runtimeMinutes: {
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

CustomMovieSchema.index({ userId: 1, customId: 1 }, { unique: true });

export const CustomMovie =
  (mongoose.models.CustomMovie as mongoose.Model<ICustomMovie>) ||
  mongoose.model<ICustomMovie>("CustomMovie", CustomMovieSchema);
