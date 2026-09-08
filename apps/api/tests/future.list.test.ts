import { afterAll, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import type { FastifyInstance } from "fastify";
import { startTestDb, stopTestDb, clearDb } from "./helpers/db";
import {
  authHeaders,
  createTestApp,
  registerAndLogin,
  type TestUser,
} from "./helpers/app";
import type { FutureListResponse } from "shared";

describe("future list route", () => {
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
    const res = await app.inject({ method: "GET", url: "/future" });
    expect(res.statusCode).toBe(401);
  });

  it("returns an empty list initially", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/future",
      headers: authHeaders(user.accessToken),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json<FutureListResponse>()).toEqual({ movies: [], series: [] });
  });

  it("returns movies and series from the want to watch list", async () => {
    await app.inject({
      method: "POST",
      url: "/future/movie",
      headers: authHeaders(user.accessToken),
      payload: {
        tmdbId: 550,
        title: "Fight Club",
        posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      },
    });
    await app.inject({
      method: "POST",
      url: "/future/movie",
      headers: authHeaders(user.accessToken),
      payload: { tmdbId: 157336, title: "Interstellar" },
    });
    await app.inject({
      method: "POST",
      url: "/future/series",
      headers: authHeaders(user.accessToken),
      payload: {
        tmdbId: 1396,
        name: "Breaking Bad",
        posterPath: null,
      },
    });

    const res = await app.inject({
      method: "GET",
      url: "/future",
      headers: authHeaders(user.accessToken),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<FutureListResponse>();

    expect(body.movies).toHaveLength(2);
    expect(body.movies.map((m) => m.tmdbId).sort((a, b) => a - b)).toEqual([
      550, 157336,
    ]);
    const movie = body.movies[0]!;
    expect(movie).toMatchObject({
      tmdbId: 550,
      title: "Fight Club",
      posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      mediaType: "movie",
    });
    expect(typeof movie.addedAt).toBe("string");

    const series = body.series[0]!;
    expect(body.series).toHaveLength(1);
    expect(series).toMatchObject({
      tmdbId: 1396,
      name: "Breaking Bad",
      mediaType: "tv",
    });
    expect(typeof series.addedAt).toBe("string");
  });
});