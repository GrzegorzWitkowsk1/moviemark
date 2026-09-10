import type { FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";
import { buildTmdbUrl, tmdbRequestHeaders } from "../lib/tmdb";
import { config } from "../config";

const TMDB_PROXY_PATH =
  /^(?:(?:movie|tv)\/\d+(?:\/(?:season\/\d+|similar))?|movie\/(?:now_playing|upcoming)|tv\/on_the_air|trending\/(?:movie|tv)\/(?:day|week)|genre\/(?:movie|tv)\/list|search\/multi)$/;

const LANGUAGE_RE = /^[a-z]{2}(?:-[A-Z]{2})?$/;

export async function tmdbRoutes(app: FastifyInstance) {
  await app.register(rateLimit, {
    max: config.tmdbRateLimitMax,
    timeWindow: "1 minute",
  });

  app.get<{
    Params: { "*": string };
    Querystring: { language?: string; query?: string };
  }>(
    "/tmdb/*",
    { preHandler: app.authenticate },
    async (request, reply) => {
      const rawPath = request.params["*"];
      if (!TMDB_PROXY_PATH.test(rawPath)) {
        return reply.code(400).send({ error: "error.tmdb.invalidPath" });
      }

      const params = new URLSearchParams();
      const { language, query } = request.query;

      if (language !== undefined) {
        if (!LANGUAGE_RE.test(language)) {
          return reply.code(400).send({ error: "error.tmdb.invalidLanguage" });
        }
        params.set("language", language);
      }
      if (query !== undefined) {
        if (query.length > 100) {
          return reply.code(400).send({ error: "error.tmdb.invalidQuery" });
        }
        params.set("query", query);
      }

      const queryString = params.toString();
      const url = buildTmdbUrl(`/${rawPath}${queryString ? `?${queryString}` : ""}`);
      if (!url) {
        return reply.code(503).send({ error: "error.tmdb.notConfigured" });
      }

      const res = await fetch(url, { headers: tmdbRequestHeaders() });
      const body = await res.text();

      return reply
        .code(res.status)
        .type(res.headers.get("content-type") ?? "application/json")
        .send(body);
    }
  );
}