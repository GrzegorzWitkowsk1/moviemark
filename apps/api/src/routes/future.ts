import type { FastifyInstance } from "fastify";
import { parseTmdbId, userId } from "../lib/request";
import type {
  AddFutureMovieRequest,
  AddFutureSeriesRequest,
  FutureListResponse,
  FutureStatusResponse,
} from "shared";
import {
  addMovie,
  addSeries,
  getFutureList,
  getMovieStatus,
  getSeriesStatus,
  removeMovie,
  removeSeries,
} from "../services/future";

interface TmdbIdParams {
  tmdbId: string;
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
      return getMovieStatus(userId(request), tmdbId);
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
    async (request) => addMovie(userId(request), request.body)
  );

  app.delete<{
    Params: TmdbIdParams;
    Reply: FutureStatusResponse;
  }>(
    "/future/movie/:tmdbId",
    { preHandler: app.authenticate },
    async (request) => {
      const tmdbId = parseTmdbId(request.params.tmdbId);
      return removeMovie(userId(request), tmdbId);
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
      return getSeriesStatus(userId(request), tmdbId);
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
    async (request) => addSeries(userId(request), request.body)
  );

  app.delete<{
    Params: TmdbIdParams;
    Reply: FutureStatusResponse;
  }>(
    "/future/series/:tmdbId",
    { preHandler: app.authenticate },
    async (request) => {
      const tmdbId = parseTmdbId(request.params.tmdbId);
      return removeSeries(userId(request), tmdbId);
    }
  );

  app.get<{
    Reply: FutureListResponse;
  }>(
    "/future",
    { preHandler: app.authenticate },
    async (request) => getFutureList(userId(request))
  );
}