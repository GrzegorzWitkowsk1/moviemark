import type { FastifyInstance } from "fastify";
import { parseTmdbId, userId } from "../lib/request";
import type {
  AddMovieRequest,
  CollectionResponse,
  MarkEpisodesRequest,
  MovieStatusResponse,
  SeriesStatusResponse,
} from "shared";
import {
  addMovie,
  getCollection,
  getMovieStatus,
  getSeriesStatus,
  markEpisodes,
  removeMovie,
  removeSeries,
  uncheckEpisode,
} from "../services/collection";

interface EpisodeQueryParams {
  season: string;
  episode: string;
}

interface TmdbIdParams {
  tmdbId: string;
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
      return getMovieStatus(userId(request), tmdbId);
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
    Reply: MovieStatusResponse;
  }>(
    "/collection/movie/:tmdbId",
    { preHandler: app.authenticate },
    async (request) => {
      const tmdbId = parseTmdbId(request.params.tmdbId);
      return removeMovie(userId(request), tmdbId);
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
      return getSeriesStatus(userId(request), tmdbId);
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
            tmdbId: { type: "number", not: { const: 0 } },
            season: { type: "number", minimum: 1 },
            episodes: {
              type: "array",
              minItems: 1,
              items: { type: "number", minimum: 1 },
            },
            name: { type: "string", minLength: 1 },
            posterPath: { type: ["string", "null"], default: null },
            totalEpisodes: { type: "number", minimum: 0 },
            rating: { type: ["number", "null"], default: null },
          },
        },
      },
    },
    async (request) => markEpisodes(userId(request), request.body)
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
        return reply.code(400).send({ error: "error.collection.invalidEpisodeQuery" });
      }
      return uncheckEpisode(userId(request), tmdbId, season, episode);
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
      return removeSeries(userId(request), tmdbId);
    }
  );

  app.get<{
    Reply: CollectionResponse;
  }>(
    "/collection",
    { preHandler: app.authenticate },
    async (request) => getCollection(userId(request))
  );
}