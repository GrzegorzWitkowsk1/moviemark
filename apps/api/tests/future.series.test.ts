import { afterAll, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import type { FastifyInstance } from "fastify";
import { startTestDb, stopTestDb, clearDb } from "./helpers/db";
import { authHeaders, createTestApp, registerAndLogin } from "./helpers/app";

describe("future series routes", () => {
  let app: FastifyInstance;
  let accessToken: string;

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
    accessToken = (await registerAndLogin(app)).accessToken;
  });

  it("requires authentication", async () => {
    const getRes = await app.inject({
      method: "GET",
      url: "/future/series/1396",
    });
    expect(getRes.statusCode).toBe(401);

    const postRes = await app.inject({
      method: "POST",
      url: "/future/series",
      payload: { tmdbId: 1396, name: "Breaking Bad" },
    });
    expect(postRes.statusCode).toBe(401);

    const deleteRes = await app.inject({
      method: "DELETE",
      url: "/future/series/1396",
    });
    expect(deleteRes.statusCode).toBe(401);
  });

  it("reports a series as not wanted initially", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/future/series/1396",
      headers: authHeaders(accessToken),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json<{ wanted: boolean }>()).toEqual({ wanted: false });
  });

  it("adds a series to the want to watch list", async () => {
    const addRes = await app.inject({
      method: "POST",
      url: "/future/series",
      headers: authHeaders(accessToken),
      payload: {
        tmdbId: 1396,
        name: "Breaking Bad",
        posterPath: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
        rating: 8.9,
      },
    });

    expect(addRes.statusCode).toBe(200);
    expect(addRes.json<{ wanted: boolean }>()).toEqual({ wanted: true });

    const statusRes = await app.inject({
      method: "GET",
      url: "/future/series/1396",
      headers: authHeaders(accessToken),
    });
    expect(statusRes.json<{ wanted: boolean }>()).toEqual({ wanted: true });
  });

  it("rejects adding the same series twice", async () => {
    const payload = { tmdbId: 1396, name: "Breaking Bad" };
    await app.inject({
      method: "POST",
      url: "/future/series",
      headers: authHeaders(accessToken),
      payload,
    });

    const res = await app.inject({
      method: "POST",
      url: "/future/series",
      headers: authHeaders(accessToken),
      payload,
    });

    expect(res.statusCode).toBe(409);
    expect(res.json<{ error: string }>()).toEqual({
      error: "error.future.seriesAlreadyAdded",
    });
  });

  it("removes a series and tolerates double remove", async () => {
    await app.inject({
      method: "POST",
      url: "/future/series",
      headers: authHeaders(accessToken),
      payload: { tmdbId: 1396, name: "Breaking Bad" },
    });

    const firstDelete = await app.inject({
      method: "DELETE",
      url: "/future/series/1396",
      headers: authHeaders(accessToken),
    });
    expect(firstDelete.statusCode).toBe(200);
    expect(firstDelete.json<{ wanted: boolean }>()).toEqual({ wanted: false });

    const secondDelete = await app.inject({
      method: "DELETE",
      url: "/future/series/1396",
      headers: authHeaders(accessToken),
    });
    expect(secondDelete.statusCode).toBe(200);
    expect(secondDelete.json<{ wanted: boolean }>()).toEqual({ wanted: false });
  });

  it("rejects an invalid body", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/future/series",
      headers: authHeaders(accessToken),
      payload: { tmdbId: 1396 },
    });

    expect(res.statusCode).toBe(400);
  });
});