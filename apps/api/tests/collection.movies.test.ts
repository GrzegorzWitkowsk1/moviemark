import { afterAll, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import type { FastifyInstance } from "fastify";
import { startTestDb, stopTestDb, clearDb } from "./helpers/db";
import { authHeaders, createTestApp, registerAndLogin } from "./helpers/app";

describe("collection movie routes", () => {
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
      url: "/collection/movie/550",
    });
    expect(getRes.statusCode).toBe(401);

    const postRes = await app.inject({
      method: "POST",
      url: "/collection/movie",
      payload: { tmdbId: 550, title: "Fight Club" },
    });
    expect(postRes.statusCode).toBe(401);

    const deleteRes = await app.inject({
      method: "DELETE",
      url: "/collection/movie/550",
    });
    expect(deleteRes.statusCode).toBe(401);
  });

  it("reports a movie as not watched initially", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/collection/movie/550",
      headers: authHeaders(accessToken),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json<{ watched: boolean }>()).toEqual({ watched: false });
  });

  it("adds a movie to the collection", async () => {
    const addRes = await app.inject({
      method: "POST",
      url: "/collection/movie",
      headers: authHeaders(accessToken),
      payload: { tmdbId: 550, title: "Fight Club", posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg" },
    });

    expect(addRes.statusCode).toBe(200);
    expect(addRes.json<{ watched: boolean }>()).toEqual({ watched: true });

    const statusRes = await app.inject({
      method: "GET",
      url: "/collection/movie/550",
      headers: authHeaders(accessToken),
    });
    expect(statusRes.json<{ watched: boolean }>()).toEqual({ watched: true });
  });

  it("rejects adding the same movie twice", async () => {
    const payload = { tmdbId: 550, title: "Fight Club" };
    await app.inject({
      method: "POST",
      url: "/collection/movie",
      headers: authHeaders(accessToken),
      payload,
    });

    const res = await app.inject({
      method: "POST",
      url: "/collection/movie",
      headers: authHeaders(accessToken),
      payload,
    });

    expect(res.statusCode).toBe(409);
    expect(res.json<{ error: string }>()).toEqual({
      error: "error.collection.movieAlreadyAdded",
    });
  });

  it("removes a movie and tolerates double remove", async () => {
    await app.inject({
      method: "POST",
      url: "/collection/movie",
      headers: authHeaders(accessToken),
      payload: { tmdbId: 550, title: "Fight Club" },
    });

    const firstDelete = await app.inject({
      method: "DELETE",
      url: "/collection/movie/550",
      headers: authHeaders(accessToken),
    });
    expect(firstDelete.statusCode).toBe(200);
    expect(firstDelete.json<{ watched: boolean }>()).toEqual({ watched: false });

    const secondDelete = await app.inject({
      method: "DELETE",
      url: "/collection/movie/550",
      headers: authHeaders(accessToken),
    });
    expect(secondDelete.statusCode).toBe(200);
    expect(secondDelete.json<{ watched: boolean }>()).toEqual({ watched: false });
  });

  it("rejects an invalid body", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/collection/movie",
      headers: authHeaders(accessToken),
      payload: { tmdbId: 550 },
    });

    expect(res.statusCode).toBe(400);
  });
});