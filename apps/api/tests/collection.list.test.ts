import { afterAll, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import type { FastifyInstance } from "fastify";
import { startTestDb, stopTestDb, clearDb } from "./helpers/db";
import { authHeaders, createTestApp, registerAndLogin, type TestUser } from "./helpers/app";
import type { CollectionResponse } from "shared";

describe("collection list route", () => {
  let app: FastifyInstance;
  let user: TestUser;

  beforeAll(async () => {
    await startTestDb();
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearDb();
    user = await registerAndLogin(app);
  });

  it("requires authentication", async () => {
    const res = await app.inject({ method: "GET", url: "/collection" });
    expect(res.statusCode).toBe(401);
  });

  it("returns an empty collection initially", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/collection",
      headers: authHeaders(user.accessToken),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json<CollectionResponse>()).toEqual({ movies: [], series: [] });
  });

  it("returns movies and series from the collection", async () => {
    await app.inject({
      method: "POST",
      url: "/collection/movie",
      headers: authHeaders(user.accessToken),
      payload: { tmdbId: 550, title: "Fight Club", posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg" },
    });
    await app.inject({
      method: "POST",
      url: "/collection/movie",
      headers: authHeaders(user.accessToken),
      payload: { tmdbId: 157336, title: "Interstellar" },
    });
    await app.inject({
      method: "PUT",
      url: "/collection/series/episode",
      headers: authHeaders(user.accessToken),
      payload: {
        tmdbId: 1396,
        season: 1,
        episodes: [1, 2, 3],
        name: "Breaking Bad",
        posterPath: null,
        totalEpisodes: 36,
      },
    });

    const res = await app.inject({
      method: "GET",
      url: "/collection",
      headers: authHeaders(user.accessToken),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<CollectionResponse>();

    expect(body.movies).toHaveLength(2);
    expect(body.movies.map((m) => m.tmdbId).sort((a, b) => a - b)).toEqual([550, 157336]);
    const movie = body.movies[0]!;
    expect(movie).toMatchObject({
      tmdbId: 550,
      title: "Fight Club",
      posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    });
    expect(typeof movie.watchedAt).toBe("string");

    const series = body.series[0]!;
    expect(body.series).toHaveLength(1);
    expect(series).toMatchObject({
      tmdbId: 1396,
      name: "Breaking Bad",
      totalEpisodes: 36,
      watchedCount: 3,
      watchedEpisodes: [
        { season: 1, episode: 1 },
        { season: 1, episode: 2 },
        { season: 1, episode: 3 },
      ],
    });
  });
});