import { afterAll, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import type { FastifyInstance } from "fastify";
import { startTestDb, stopTestDb, clearDb } from "./helpers/db";
import {
  authHeaders,
  createTestApp,
  registerAndLogin,
  type TestUser,
} from "./helpers/app";
import type { SeriesStatusResponse } from "shared";

describe("collection per-user isolation", () => {
  let app: FastifyInstance;
  let userA: TestUser;
  let userB: TestUser;

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
    userA = await registerAndLogin(app);
    userB = await registerAndLogin(app);
  });

  it("keeps movie collections separate", async () => {
    await app.inject({
      method: "POST",
      url: "/collection/movie",
      headers: authHeaders(userA.accessToken),
      payload: { tmdbId: 550, title: "Fight Club" },
    });

    const aStatus = await app.inject({
      method: "GET",
      url: "/collection/movie/550",
      headers: authHeaders(userA.accessToken),
    });
    expect(aStatus.json<{ watched: boolean }>()).toEqual({ watched: true });

    const bStatus = await app.inject({
      method: "GET",
      url: "/collection/movie/550",
      headers: authHeaders(userB.accessToken),
    });
    expect(bStatus.json<{ watched: boolean }>()).toEqual({ watched: false });

    await app.inject({
      method: "POST",
      url: "/collection/movie",
      headers: authHeaders(userB.accessToken),
      payload: { tmdbId: 550, title: "Fight Club" },
    });

    await app.inject({
      method: "DELETE",
      url: "/collection/movie/550",
      headers: authHeaders(userA.accessToken),
    });

    const aAfterDelete = await app.inject({
      method: "GET",
      url: "/collection/movie/550",
      headers: authHeaders(userA.accessToken),
    });
    expect(aAfterDelete.json<{ watched: boolean }>()).toEqual({ watched: false });

    const bAfterDelete = await app.inject({
      method: "GET",
      url: "/collection/movie/550",
      headers: authHeaders(userB.accessToken),
    });
    expect(bAfterDelete.json<{ watched: boolean }>()).toEqual({ watched: true });
  });

  it("keeps series collections separate", async () => {
    const seriesId = 1396;
    const body = {
      tmdbId: seriesId,
      season: 1,
      episodes: [1, 2],
      name: "Breaking Bad",
      posterPath: null,
      totalEpisodes: 36,
    };

    await app.inject({
      method: "PUT",
      url: "/collection/series/episode",
      headers: authHeaders(userA.accessToken),
      payload: body,
    });

    const aStatus = await app.inject({
      method: "GET",
      url: `/collection/series/${seriesId}`,
      headers: authHeaders(userA.accessToken),
    });
    expect(aStatus.json<SeriesStatusResponse>()).toMatchObject({
      watched: true,
      watchedCount: 2,
    });

    const bStatus = await app.inject({
      method: "GET",
      url: `/collection/series/${seriesId}`,
      headers: authHeaders(userB.accessToken),
    });
    expect(bStatus.json<SeriesStatusResponse>()).toMatchObject({
      watched: false,
      watchedCount: 0,
    });

    // A unchecks everything → series removed for A only
    await app.inject({
      method: "DELETE",
      url: `/collection/series/${seriesId}/episode?season=1&episode=1`,
      headers: authHeaders(userA.accessToken),
    });
    await app.inject({
      method: "DELETE",
      url: `/collection/series/${seriesId}/episode?season=1&episode=2`,
      headers: authHeaders(userA.accessToken),
    });

    const aAfterUncheck = await app.inject({
      method: "GET",
      url: `/collection/series/${seriesId}`,
      headers: authHeaders(userA.accessToken),
    });
    expect(aAfterUncheck.json<SeriesStatusResponse>()).toMatchObject({
      watched: false,
    });

    const bAfterUncheck = await app.inject({
      method: "GET",
      url: `/collection/series/${seriesId}`,
      headers: authHeaders(userB.accessToken),
    });
    expect(bAfterUncheck.json<SeriesStatusResponse>()).toMatchObject({
      watched: false,
      watchedCount: 0,
    });
  });
});