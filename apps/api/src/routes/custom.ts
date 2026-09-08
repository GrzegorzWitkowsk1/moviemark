import type { FastifyInstance } from "fastify";
import { Types } from "mongoose";
import { User } from "../models/User";
import { CustomMovie } from "../models/CustomMovie";
import { CustomSeries } from "../models/CustomSeries";
import { WatchedMovie } from "../models/WatchedMovie";
import { WatchedSeries } from "../models/WatchedSeries";
import type {
  CustomMediaIdParams,
  CustomMovieRequest,
  CustomMovieResponse,
  CustomSeriesRequest,
  CustomSeriesResponse,
} from "shared";

interface CustomTypeQuery {
  type: string;
}

function userId(request: { user: { id: string } }): Types.ObjectId {
  return new Types.ObjectId(request.user.id);
}

async function allocateCustomId(uid: Types.ObjectId): Promise<number> {
  await User.updateOne(
    { _id: uid, nextCustomId: { $exists: false } },
    { $set: { nextCustomId: 1 } }
  );
  const user = await User.findByIdAndUpdate(
    uid,
    { $inc: { nextCustomId: 1 } },
    { new: true }
  );
  if (!user) {
    const err = new Error("error.auth.userNotFound") as Error & {
      statusCode: number;
    };
    err.statusCode = 404;
    throw err;
  }
  const customId = -(user.nextCustomId - 1);
  if (customId >= 0) {
    throw new Error("Failed to allocate custom id");
  }
  return customId;
}

export async function customRoutes(app: FastifyInstance) {
  app.post<{
    Body: CustomMovieRequest;
    Reply: CustomMovieResponse | { error: string };
  }>(
    "/custom/movie",
    {
      preHandler: app.authenticate,
      schema: {
        body: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", minLength: 1 },
            genreIds: { type: "array", items: { type: "number" }, default: [] },
            year: { type: ["string", "null"], default: null },
            runtimeMinutes: { type: ["integer", "null"], minimum: 1, default: null },
          },
        },
      },
    },
    async (request) => {
      const uid = userId(request);
      const { name, genreIds, year, runtimeMinutes } = request.body;
      const customId = await allocateCustomId(uid);

      await CustomMovie.create({
        userId: uid,
        customId,
        name,
        genreIds: genreIds ?? [],
        year: year ?? null,
        runtimeMinutes: runtimeMinutes ?? null,
      });

      await WatchedMovie.create({
        userId: uid,
        tmdbId: customId,
        title: name,
        posterPath: null,
        rating: null,
      });

      return {
        customId,
        mediaType: "movie",
        name,
        genreIds: genreIds ?? [],
        year: year ?? null,
        runtimeMinutes: runtimeMinutes ?? null,
        watchedAt: new Date().toISOString(),
      };
    }
  );

  app.post<{
    Body: CustomSeriesRequest;
    Reply: CustomSeriesResponse | { error: string };
  }>(
    "/custom/series",
    {
      preHandler: app.authenticate,
      schema: {
        body: {
          type: "object",
          required: ["name", "seasons"],
          properties: {
            name: { type: "string", minLength: 1 },
            genreIds: { type: "array", items: { type: "number" }, default: [] },
            year: { type: ["string", "null"], default: null },
            seasons: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                required: ["seasonNumber", "episodes"],
                properties: {
                  seasonNumber: { type: "number", minimum: 1 },
                  episodes: {
                    type: "array",
                    minItems: 1,
                    items: {
                      type: "object",
                      required: ["season", "episode", "name"],
                      properties: {
                        season: { type: "number", minimum: 1 },
                        episode: { type: "number", minimum: 1 },
                        name: { type: "string", minLength: 1 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request) => {
      const uid = userId(request);
      const { name, genreIds, year, seasons } = request.body;

      const totalEpisodes = seasons.reduce(
        (sum, season) => sum + season.episodes.length,
        0
      );
      const customId = await allocateCustomId(uid);

      await CustomSeries.create({
        userId: uid,
        customId,
        name,
        genreIds: genreIds ?? [],
        year: year ?? null,
        seasons,
      });

      await WatchedSeries.create({
        userId: uid,
        tmdbId: customId,
        name,
        posterPath: null,
        totalEpisodes,
        rating: null,
        watchedEpisodes: [{ season: 1, episode: 1 }],
      });

      return {
        customId,
        mediaType: "tv",
        name,
        genreIds: genreIds ?? [],
        year: year ?? null,
        seasons,
        totalEpisodes,
        watchedAt: new Date().toISOString(),
      };
    }
  );

  app.get<{
    Params: CustomMediaIdParams;
    Querystring: CustomTypeQuery;
    Reply: CustomMovieResponse | CustomSeriesResponse | { error: string };
  }>(
    "/custom/:id",
    { preHandler: app.authenticate },
    async (request, reply) => {
      const rawId = Number(request.params.id);
      if (!Number.isFinite(rawId) || rawId >= 0) {
        return reply.code(400).send({ error: "error.custom.invalidId" });
      }
      const uid = userId(request);
      const type = request.query.type;

      if (type === "movie") {
        const doc = await CustomMovie.findOne({ userId: uid, customId: rawId });
        if (!doc) {
          return reply.code(404).send({ error: "error.custom.movieNotFound" });
        }
        return {
          customId: doc.customId,
          mediaType: "movie",
          name: doc.name,
          genreIds: doc.genreIds,
          year: doc.year,
          runtimeMinutes: doc.runtimeMinutes,
          watchedAt: doc.watchedAt.toISOString(),
        };
      }

      if (type === "tv") {
        const doc = await CustomSeries.findOne({ userId: uid, customId: rawId });
        if (!doc) {
          return reply.code(404).send({ error: "error.custom.seriesNotFound" });
        }
        return {
          customId: doc.customId,
          mediaType: "tv",
          name: doc.name,
          genreIds: doc.genreIds,
          year: doc.year,
          seasons: doc.seasons,
          totalEpisodes: doc.seasons.reduce(
            (sum, season) => sum + season.episodes.length,
            0
          ),
          watchedAt: doc.watchedAt.toISOString(),
        };
      }

      return reply.code(400).send({ error: "error.invalidMediaType" });
    }
  );
}
