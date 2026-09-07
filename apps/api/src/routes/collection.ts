import type { FastifyInstance } from "fastify";
import { Types } from "mongoose";
import { WatchedMovie } from "../models/WatchedMovie";
import { WatchedSeries } from "../models/WatchedSeries";
import type {
  AddMovieRequest,
  CollectionResponse,
  MarkEpisodesRequest,
  MovieStatusResponse,
  SeriesStatusResponse,
} from "shared";

interface EpisodeQueryParams {
  season: string;
  episode: string;
}

interface TmdbIdParams {
  tmdbId: string;
}

function toMovieResponse(doc: { tmdbId: number; title: string; posterPath: string | null; watchedAt: Date }) {
  return {
    tmdbId: doc.tmdbId,
    title: doc.title,
    posterPath: doc.posterPath,
    watchedAt: doc.watchedAt.toISOString(),
  };
}

function toPlainEpisodes(episodes: { season: number; episode: number }[]) {
  return episodes.map(({ season, episode }) => ({ season, episode }));
}

function toSeriesResponse(doc: {
  tmdbId: number;
  name: string;
  posterPath: string | null;
  totalEpisodes: number;
  watchedEpisodes: { season: number; episode: number }[];
  watchedAt: Date;
}) {
  return {
    tmdbId: doc.tmdbId,
    name: doc.name,
    posterPath: doc.posterPath,
    totalEpisodes: doc.totalEpisodes,
    watchedCount: doc.watchedEpisodes.length,
    watchedEpisodes: toPlainEpisodes(doc.watchedEpisodes),
    watchedAt: doc.watchedAt.toISOString(),
  };
}

function toSeriesStatusResponse(doc: {
  totalEpisodes: number;
  watchedEpisodes: { season: number; episode: number }[];
}) {
  return {
    watched: true,
    watchedCount: doc.watchedEpisodes.length,
    totalEpisodes: doc.totalEpisodes,
    watchedEpisodes: toPlainEpisodes(doc.watchedEpisodes),
  };
}

function parseTmdbId(raw: string): number {
  const id = Number(raw);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Invalid tmdbId");
  }
  return id;
}

function userId(request: { user: { id: string } }): Types.ObjectId {
  return new Types.ObjectId(request.user.id);
}

export async function collectionRoutes(app: FastifyInstance) {
  app.get<{
    Params: TmdbIdParams;
    Reply: MovieStatusResponse;
  }>(
    "/collection/movie/:tmdbId",
    { preHandler: app.authenticate },
    async (request) => {
      const tmdbId = parseTmdbId(request.params.tmdbId);
      const doc = await WatchedMovie.findOne({
        userId: userId(request),
        tmdbId,
      });
      return { watched: !!doc };
    }
  );

  app.post<{
    Body: AddMovieRequest;
    Reply: MovieStatusResponse | { error: string };
  }>(
    "/collection/movie",
    {
      preHandler: app.authenticate,
      schema: {
        body: {
          type: "object",
          required: ["tmdbId", "title"],
          properties: {
            tmdbId: { type: "number", minimum: 1 },
            title: { type: "string", minLength: 1 },
            posterPath: { type: ["string", "null"], default: null },
          },
        },
      },
    },
    async (request, reply) => {
      const { tmdbId, title, posterPath } = request.body;
      const existing = await WatchedMovie.findOne({
        userId: userId(request),
        tmdbId,
      });
      if (existing) {
        return reply.code(409).send({ error: "Movie already in collection" });
      }
      await WatchedMovie.create({
        userId: userId(request),
        tmdbId,
        title,
        posterPath: posterPath ?? null,
      });
      return { watched: true };
    }
  );

  app.delete<{
    Params: TmdbIdParams;
    Reply: MovieStatusResponse;
  }>(
    "/collection/movie/:tmdbId",
    { preHandler: app.authenticate },
    async (request) => {
      const tmdbId = parseTmdbId(request.params.tmdbId);
      await WatchedMovie.findOneAndDelete({
        userId: userId(request),
        tmdbId,
      });
      return { watched: false };
    }
  );

  app.get<{
    Params: TmdbIdParams;
    Reply: SeriesStatusResponse;
  }>(
    "/collection/series/:tmdbId",
    { preHandler: app.authenticate },
    async (request) => {
      const tmdbId = parseTmdbId(request.params.tmdbId);
      const doc = await WatchedSeries.findOne({
        userId: userId(request),
        tmdbId,
      });
      if (!doc) {
        return {
          watched: false,
          watchedCount: 0,
          totalEpisodes: 0,
          watchedEpisodes: [],
        };
      }
      return {
        watched: true,
        watchedCount: doc.watchedEpisodes.length,
        totalEpisodes: doc.totalEpisodes,
        watchedEpisodes: toPlainEpisodes(doc.watchedEpisodes),
      };
    }
  );

  app.put<{
    Body: MarkEpisodesRequest;
    Reply: SeriesStatusResponse;
  }>(
    "/collection/series/episode",
    {
      preHandler: app.authenticate,
      schema: {
        body: {
          type: "object",
          required: ["tmdbId", "season", "episodes", "name", "totalEpisodes"],
          properties: {
            tmdbId: { type: "number", minimum: 1 },
            season: { type: "number", minimum: 1 },
            episodes: {
              type: "array",
              minItems: 1,
              items: { type: "number", minimum: 1 },
            },
            name: { type: "string", minLength: 1 },
            posterPath: { type: ["string", "null"], default: null },
            totalEpisodes: { type: "number", minimum: 0 },
          },
        },
      },
    },
    async (request) => {
      const { tmdbId, season, episodes, name, posterPath, totalEpisodes } =
        request.body;
      const uid = userId(request);

      let doc = await WatchedSeries.findOne({ userId: uid, tmdbId });

      if (!doc) {
        doc = await WatchedSeries.create({
          userId: uid,
          tmdbId,
          name,
          posterPath: posterPath ?? null,
          totalEpisodes,
          watchedEpisodes: episodes.map((episode) => ({ season, episode })),
        });
      } else {
        for (const episode of episodes) {
          const already = doc.watchedEpisodes.some(
            (e) => e.season === season && e.episode === episode
          );
          if (!already) {
            doc.watchedEpisodes.push({ season, episode });
          }
        }
        doc.totalEpisodes = totalEpisodes;
        doc.watchedAt = new Date();
        doc = await doc.save();
      }

      return toSeriesStatusResponse(doc);
    }
  );

  app.delete<{
    Params: TmdbIdParams;
    Querystring: EpisodeQueryParams;
    Reply: SeriesStatusResponse | { error: string };
  }>(
    "/collection/series/:tmdbId/episode",
    { preHandler: app.authenticate },
    async (request, reply) => {
      const tmdbId = parseTmdbId(request.params.tmdbId);
      const season = Number(request.query.season);
      const episode = Number(request.query.episode);
      if (!Number.isFinite(season) || !Number.isFinite(episode)) {
        return reply.code(400).send({ error: "Invalid episode query" });
      }
      const uid = userId(request);

      const doc = await WatchedSeries.findOne({ userId: uid, tmdbId });
      if (!doc) {
        return {
          watched: false,
          watchedCount: 0,
          totalEpisodes: 0,
          watchedEpisodes: [],
        };
      }

      doc.watchedEpisodes = doc.watchedEpisodes.filter(
        (e) => e.season !== season || e.episode !== episode
      );

      if (doc.watchedEpisodes.length === 0) {
        await WatchedSeries.deleteOne({ _id: doc._id });
        return {
          watched: false,
          watchedCount: 0,
          totalEpisodes: 0,
          watchedEpisodes: [],
        };
      }

      doc.watchedAt = new Date();
      const saved = await doc.save();
      return toSeriesStatusResponse(saved);
    }
  );

  app.delete<{
    Params: TmdbIdParams;
    Reply: MovieStatusResponse;
  }>(
    "/collection/series/:tmdbId",
    { preHandler: app.authenticate },
    async (request) => {
      const tmdbId = parseTmdbId(request.params.tmdbId);
      await WatchedSeries.deleteOne({
        userId: userId(request),
        tmdbId,
      });
      return { watched: false };
    }
  );

  app.get<{
    Reply: CollectionResponse;
  }>(
    "/collection",
    { preHandler: app.authenticate },
    async (request) => {
      const uid = userId(request);
      const [movies, series] = await Promise.all([
        WatchedMovie.find({ userId: uid }),
        WatchedSeries.find({ userId: uid }),
      ]);
      return {
        movies: movies.map(toMovieResponse),
        series: series.map(toSeriesResponse),
      };
    }
  );
}
