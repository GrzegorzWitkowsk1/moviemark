import type { FastifyInstance } from "fastify";
import { Types } from "mongoose";
import { FutureMovie } from "../models/FutureMovie";
import { FutureSeries } from "../models/FutureSeries";
import { getTmdbDetails } from "../lib/tmdb";
import type {
  AddFutureMovieRequest,
  AddFutureSeriesRequest,
  FutureListResponse,
  FutureMovieResponse,
  FutureSeriesResponse,
  FutureStatusResponse,
} from "shared";

interface TmdbIdParams {
  tmdbId: string;
}

function toMovieResponse(
  doc: {
    tmdbId: number;
    title: string;
    posterPath: string | null;
    rating: number | null;
    addedAt: Date;
  },
  enrichment?: {
    rating: number;
    voteCount: number;
    overview: string;
    year: string | null;
    genreIds: number[];
  } | null
): FutureMovieResponse {
  return {
    tmdbId: doc.tmdbId,
    title: doc.title,
    posterPath: doc.posterPath,
    addedAt: doc.addedAt.toISOString(),
    mediaType: "movie",
    rating: doc.rating ?? enrichment?.rating,
    ...(enrichment
      ? {
          voteCount: enrichment.voteCount,
          overview: enrichment.overview,
          year: enrichment.year,
          genreIds: enrichment.genreIds,
        }
      : {}),
  };
}

function toSeriesResponse(
  doc: {
    tmdbId: number;
    name: string;
    posterPath: string | null;
    rating: number | null;
    addedAt: Date;
  },
  enrichment?: {
    rating: number;
    voteCount: number;
    overview: string;
    year: string | null;
    genreIds: number[];
  } | null
): FutureSeriesResponse {
  return {
    tmdbId: doc.tmdbId,
    name: doc.name,
    posterPath: doc.posterPath,
    addedAt: doc.addedAt.toISOString(),
    mediaType: "tv",
    rating: doc.rating ?? enrichment?.rating,
    ...(enrichment
      ? {
          voteCount: enrichment.voteCount,
          overview: enrichment.overview,
          year: enrichment.year,
          genreIds: enrichment.genreIds,
        }
      : {}),
  };
}

function parseTmdbId(raw: string): number {
  const id = Number(raw);
  if (!Number.isFinite(id) || id === 0) {
    throw new Error("Invalid tmdbId");
  }
  return id;
}

function userId(request: { user: { id: string } }): Types.ObjectId {
  return new Types.ObjectId(request.user.id);
}

export async function futureRoutes(app: FastifyInstance) {
  app.get<{
    Params: TmdbIdParams;
    Reply: FutureStatusResponse;
  }>(
    "/future/movie/:tmdbId",
    { preHandler: app.authenticate },
    async (request) => {
      const tmdbId = parseTmdbId(request.params.tmdbId);
      const doc = await FutureMovie.findOne({
        userId: userId(request),
        tmdbId,
      });
      return { wanted: !!doc };
    }
  );

  app.post<{
    Body: AddFutureMovieRequest;
    Reply: FutureStatusResponse | { error: string };
  }>(
    "/future/movie",
    {
      preHandler: app.authenticate,
      schema: {
        body: {
          type: "object",
          required: ["tmdbId", "title"],
          properties: {
            tmdbId: { type: "number", not: { const: 0 } },
            title: { type: "string", minLength: 1 },
            posterPath: { type: ["string", "null"], default: null },
            rating: { type: ["number", "null"], default: null },
          },
        },
      },
    },
    async (request, reply) => {
      const { tmdbId, title, posterPath, rating } = request.body;
      const existing = await FutureMovie.findOne({
        userId: userId(request),
        tmdbId,
      });
      if (existing) {
        return reply
          .code(409)
          .send({ error: "Movie already in want to watch list" });
      }
      await FutureMovie.create({
        userId: userId(request),
        tmdbId,
        title,
        posterPath: posterPath ?? null,
        rating: rating ?? null,
      });
      return { wanted: true };
    }
  );

  app.delete<{
    Params: TmdbIdParams;
    Reply: FutureStatusResponse;
  }>(
    "/future/movie/:tmdbId",
    { preHandler: app.authenticate },
    async (request) => {
      const tmdbId = parseTmdbId(request.params.tmdbId);
      await FutureMovie.findOneAndDelete({
        userId: userId(request),
        tmdbId,
      });
      return { wanted: false };
    }
  );

  app.get<{
    Params: TmdbIdParams;
    Reply: FutureStatusResponse;
  }>(
    "/future/series/:tmdbId",
    { preHandler: app.authenticate },
    async (request) => {
      const tmdbId = parseTmdbId(request.params.tmdbId);
      const doc = await FutureSeries.findOne({
        userId: userId(request),
        tmdbId,
      });
      return { wanted: !!doc };
    }
  );

  app.post<{
    Body: AddFutureSeriesRequest;
    Reply: FutureStatusResponse | { error: string };
  }>(
    "/future/series",
    {
      preHandler: app.authenticate,
      schema: {
        body: {
          type: "object",
          required: ["tmdbId", "name"],
          properties: {
            tmdbId: { type: "number", not: { const: 0 } },
            name: { type: "string", minLength: 1 },
            posterPath: { type: ["string", "null"], default: null },
            rating: { type: ["number", "null"], default: null },
          },
        },
      },
    },
    async (request, reply) => {
      const { tmdbId, name, posterPath, rating } = request.body;
      const existing = await FutureSeries.findOne({
        userId: userId(request),
        tmdbId,
      });
      if (existing) {
        return reply
          .code(409)
          .send({ error: "Series already in want to watch list" });
      }
      await FutureSeries.create({
        userId: userId(request),
        tmdbId,
        name,
        posterPath: posterPath ?? null,
        rating: rating ?? null,
      });
      return { wanted: true };
    }
  );

  app.delete<{
    Params: TmdbIdParams;
    Reply: FutureStatusResponse;
  }>(
    "/future/series/:tmdbId",
    { preHandler: app.authenticate },
    async (request) => {
      const tmdbId = parseTmdbId(request.params.tmdbId);
      await FutureSeries.findOneAndDelete({
        userId: userId(request),
        tmdbId,
      });
      return { wanted: false };
    }
  );

  app.get<{
    Reply: FutureListResponse;
  }>(
    "/future",
    { preHandler: app.authenticate },
    async (request) => {
      const uid = userId(request);
      const [movies, series] = await Promise.all([
        FutureMovie.find({ userId: uid }),
        FutureSeries.find({ userId: uid }),
      ]);

      const movieEnrichments = await Promise.all(
        movies.map((doc) => getTmdbDetails("movie", doc.tmdbId))
      );
      const seriesEnrichments = await Promise.all(
        series.map((doc) => getTmdbDetails("tv", doc.tmdbId))
      );

      return {
        movies: movies.map((doc, index) =>
          toMovieResponse(doc, movieEnrichments[index])
        ),
        series: series.map((doc, index) =>
          toSeriesResponse(doc, seriesEnrichments[index])
        ),
      };
    }
  );
}