import mongoose from "mongoose";
import type { Types } from "mongoose";

interface ICustomEpisode {
  season: number;
  episode: number;
  name: string;
}

interface ICustomSeason {
  seasonNumber: number;
  episodes: ICustomEpisode[];
}

interface ICustomSeries {
  userId: Types.ObjectId;
  customId: number;
  name: string;
  genreIds: number[];
  year: string | null;
  seasons: ICustomSeason[];
  watchedAt: Date;
}

const CustomSeriesSchema = new mongoose.Schema<ICustomSeries>(
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
    seasons: {
      type: [
        {
          seasonNumber: { type: Number, required: true },
          episodes: {
            type: [
              {
                season: { type: Number, required: true },
                episode: { type: Number, required: true },
                name: { type: String, required: true },
              },
            ],
            default: [],
          },
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

CustomSeriesSchema.index({ userId: 1, customId: 1 }, { unique: true });

export const CustomSeries =
  (mongoose.models.CustomSeries as mongoose.Model<ICustomSeries>) ||
  mongoose.model<ICustomSeries>("CustomSeries", CustomSeriesSchema);
