import { afterAll, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import type { FastifyInstance } from "fastify";
import { startTestDb, stopTestDb, clearDb } from "./helpers/db";
import { authHeaders, createTestApp, registerAndLogin, type TestUser } from "./helpers/app";
import type { StatisticsResponse } from "shared";
import { User } from "../src/models/User";
import { WatchedMovie } from "../src/models/WatchedMovie";

interface TmdbSpec {
  runtime?: number;
  episode_run_time?: number[];
  genres?: { id: number }[];
}

const tmdbOverrides: Record<string, TmdbSpec> = {};
const originalFetch = globalThis.fetch;

function mockTmdbFetch() {
  globalThis.fetch = (async (input: unknown) => {
    const url = String(input);
    const tvMatch = url.match(/\/tv\/(\d+)/);
    const movieMatch = url.match(/\/movie\/(\d+)/);
    const key = tvMatch
      ? `tv/${tvMatch[1]}`
      : movieMatch
        ? `movie/${movieMatch[1]}`
        : "";
    const spec = tmdbOverrides[key] ?? {};
    return new Response(
      JSON.stringify({
        vote_average: 0,
        vote_count: 0,
        overview: "mock",
        release_date: "2020-01-01",
        genres: spec.genres ?? [],
        runtime: spec.runtime,
        episode_run_time: spec.episode_run_time,
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }) as unknown as typeof fetch;
}

async function addMovie(
  app: FastifyInstance,
  accessToken: string,
  tmdbId: number,
  title: string
) {
  const res = await app.inject({
    method: "POST",
    url: "/collection/movie",
    headers: authHeaders(accessToken),
    payload: { tmdbId, title },
  });
  expect(res.statusCode).toBe(200);
}

async function markEpisodes(
  app: FastifyInstance,
  accessToken: string,
  payload: object
) {
  const res = await app.inject({
    method: "PUT",
    url: "/collection/series/episode",
    headers: authHeaders(accessToken),
    payload,
  });
  expect(res.statusCode).toBe(200);
}

function getStats(app: FastifyInstance, accessToken: string) {
  return app.inject({
    method: "GET",
    url: "/statistics",
    headers: authHeaders(accessToken),
  });
}

describe("statistics routes", () => {
  let app: FastifyInstance;
  let user: TestUser;
  let originalToken: string | undefined;

  beforeAll(async () => {
    originalToken = process.env.TMDB_TOKEN;
    process.env.TMDB_TOKEN = "eyJtest.statistics";
    await startTestDb();
    app = await createTestApp();
  });

  afterAll(async () => {
    if (originalToken === undefined) {
      delete process.env.TMDB_TOKEN;
    } else {
      process.env.TMDB_TOKEN = originalToken;
    }
    globalThis.fetch = originalFetch;
    await app.close();
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearDb();
    for (const key of Object.keys(tmdbOverrides)) {
      delete tmdbOverrides[key];
    }
    mockTmdbFetch();
    user = await registerAndLogin(app);
  });

  it("requires authentication", async () => {
    const res = await app.inject({ method: "GET", url: "/statistics" });
    expect(res.statusCode).toBe(401);
  });

  it("returns zeros for an empty collection", async () => {
    const res = await getStats(app, user.accessToken);
    expect(res.statusCode).toBe(200);
    expect(res.json<StatisticsResponse>()).toEqual({
      watchedMovies: 0,
      watchedSeries: 0,
      watchedEpisodes: 0,
      movieWatchtimeMinutes: 0,
      seriesWatchtimeMinutes: 0,
      moviesWatchedInYear: 0,
      seriesWatchedInYear: 0,
      watchtimeMinutesInYear: 0,
      favouriteGenres: [],
      totalMovies: 0,
      fullSeriesWatched: 0,
    });
  });

  it("aggregates TMDB media into the full statistics payload", async () => {
    tmdbOverrides["movie/550"] = {
      runtime: 139,
      genres: [{ id: 28 }, { id: 53 }],
    };
    tmdbOverrides["movie/155"] = {
      runtime: 152,
      genres: [{ id: 28 }, { id: 12 }, { id: 80 }],
    };
    tmdbOverrides["tv/1396"] = {
      episode_run_time: [47],
      genres: [{ id: 18 }],
    };
    tmdbOverrides["tv/2316"] = {
      episode_run_time: [22],
      genres: [{ id: 35 }, { id: 10751 }],
    };

    await addMovie(app, user.accessToken, 550, "Fight Club");
    await addMovie(app, user.accessToken, 155, "The Dark Knight");
    await markEpisodes(app, user.accessToken, {
      tmdbId: 1396,
      season: 1,
      episodes: [1, 2, 3],
      name: "Breaking Bad",
      totalEpisodes: 36,
    });
    await markEpisodes(app, user.accessToken, {
      tmdbId: 2316,
      season: 1,
      episodes: [1, 2],
      name: "The Office",
      totalEpisodes: 2,
    });

    const res = await getStats(app, user.accessToken);
    expect(res.statusCode).toBe(200);
    expect(res.json<StatisticsResponse>()).toEqual({
      watchedMovies: 2,
      watchedSeries: 2,
      watchedEpisodes: 5,
      movieWatchtimeMinutes: 291,
      seriesWatchtimeMinutes: 185,
      moviesWatchedInYear: 2,
      seriesWatchedInYear: 2,
      watchtimeMinutesInYear: 476,
      favouriteGenres: [
        { genreId: 28, count: 2 },
        { genreId: 12, count: 1 },
        { genreId: 18, count: 1 },
        { genreId: 35, count: 1 },
      ],
      totalMovies: 2,
      fullSeriesWatched: 1,
    });
  });

  it("uses stored runtime and genres for custom media", async () => {
    const movieRes = await app.inject({
      method: "POST",
      url: "/custom/movie",
      headers: authHeaders(user.accessToken),
      payload: {
        name: "My Movie",
        genreIds: [99, 100],
        year: "2020",
        runtimeMinutes: 100,
      },
    });
    expect(movieRes.statusCode).toBe(200);

    const seriesRes = await app.inject({
      method: "POST",
      url: "/custom/series",
      headers: authHeaders(user.accessToken),
      payload: {
        name: "My Series",
        year: "2021",
        genreIds: [99],
        seasons: [
          {
            seasonNumber: 1,
            episodes: [
              { season: 1, episode: 1, name: "EP 1" },
              { season: 1, episode: 2, name: "EP 2" },
            ],
          },
        ],
      },
    });
    expect(seriesRes.statusCode).toBe(200);

    const res = await getStats(app, user.accessToken);
    const body = res.json<StatisticsResponse>();
    expect(body).toMatchObject({
      watchedMovies: 1,
      movieWatchtimeMinutes: 100,
      watchedSeries: 1,
      seriesWatchtimeMinutes: 0,
      watchedEpisodes: 1,
      fullSeriesWatched: 0,
      totalMovies: 1,
    });
    expect(body.favouriteGenres).toEqual([
      { genreId: 99, count: 2 },
      { genreId: 100, count: 1 },
    ]);
  });

  it("excludes items watched in previous years from year metrics", async () => {
    tmdbOverrides["movie/550"] = { runtime: 120, genres: [{ id: 28 }] };
    await addMovie(app, user.accessToken, 550, "Fight Club");

    const dbUser = await User.findOne({ email: user.email });
    expect(dbUser).not.toBeNull();

    const initial = (await getStats(app, user.accessToken)).json<
      StatisticsResponse
    >();
    expect(initial.moviesWatchedInYear).toBe(1);

    await WatchedMovie.findOneAndUpdate(
      { userId: dbUser!._id, tmdbId: 550 },
      { $set: { watchedAt: new Date(2020, 0, 15) } }
    );

    const body = (await getStats(app, user.accessToken)).json<
      StatisticsResponse
    >();
    expect(body.watchedMovies).toBe(1);
    expect(body.moviesWatchedInYear).toBe(0);
    expect(body.movieWatchtimeMinutes).toBe(120);
    expect(body.watchtimeMinutesInYear).toBe(0);
    expect(body.favouriteGenres).toEqual([{ genreId: 28, count: 1 }]);
  });
});