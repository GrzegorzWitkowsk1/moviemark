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

describe("future per-user isolation", () => {
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

  it("keeps movie want to watch lists separate", async () => {
    await app.inject({
      method: "POST",
      url: "/future/movie",
      headers: authHeaders(userA.accessToken),
      payload: { tmdbId: 550, title: "Fight Club" },
    });

    const aStatus = await app.inject({
      method: "GET",
      url: "/future/movie/550",
      headers: authHeaders(userA.accessToken),
    });
    expect(aStatus.json<{ wanted: boolean }>()).toEqual({ wanted: true });

    const bStatus = await app.inject({
      method: "GET",
      url: "/future/movie/550",
      headers: authHeaders(userB.accessToken),
    });
    expect(bStatus.json<{ wanted: boolean }>()).toEqual({ wanted: false });

    await app.inject({
      method: "POST",
      url: "/future/movie",
      headers: authHeaders(userB.accessToken),
      payload: { tmdbId: 550, title: "Fight Club" },
    });

    await app.inject({
      method: "DELETE",
      url: "/future/movie/550",
      headers: authHeaders(userA.accessToken),
    });

    const aAfterDelete = await app.inject({
      method: "GET",
      url: "/future/movie/550",
      headers: authHeaders(userA.accessToken),
    });
    expect(aAfterDelete.json<{ wanted: boolean }>()).toEqual({ wanted: false });

    const bAfterDelete = await app.inject({
      method: "GET",
      url: "/future/movie/550",
      headers: authHeaders(userB.accessToken),
    });
    expect(bAfterDelete.json<{ wanted: boolean }>()).toEqual({ wanted: true });
  });

  it("keeps series want to watch lists separate", async () => {
    const seriesId = 1396;

    await app.inject({
      method: "POST",
      url: "/future/series",
      headers: authHeaders(userA.accessToken),
      payload: { tmdbId: seriesId, name: "Breaking Bad" },
    });

    const aStatus = await app.inject({
      method: "GET",
      url: `/future/series/${seriesId}`,
      headers: authHeaders(userA.accessToken),
    });
    expect(aStatus.json<{ wanted: boolean }>()).toEqual({ wanted: true });

    const bStatus = await app.inject({
      method: "GET",
      url: `/future/series/${seriesId}`,
      headers: authHeaders(userB.accessToken),
    });
    expect(bStatus.json<{ wanted: boolean }>()).toEqual({ wanted: false });
  });

  it("returns only the current user's list", async () => {
    await app.inject({
      method: "POST",
      url: "/future/movie",
      headers: authHeaders(userA.accessToken),
      payload: { tmdbId: 550, title: "Fight Club" },
    });
    await app.inject({
      method: "POST",
      url: "/future/series",
      headers: authHeaders(userB.accessToken),
      payload: { tmdbId: 1396, name: "Breaking Bad" },
    });

    const aList = await app.inject({
      method: "GET",
      url: "/future",
      headers: authHeaders(userA.accessToken),
    });
    expect(aList.json<FutureListResponse>().movies).toHaveLength(1);
    expect(aList.json<FutureListResponse>().series).toHaveLength(0);

    const bList = await app.inject({
      method: "GET",
      url: "/future",
      headers: authHeaders(userB.accessToken),
    });
    expect(bList.json<FutureListResponse>().movies).toHaveLength(0);
    expect(bList.json<FutureListResponse>().series).toHaveLength(1);
  });
});