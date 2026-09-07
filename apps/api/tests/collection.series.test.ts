import { afterAll, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import type { FastifyInstance } from "fastify";
import { startTestDb, stopTestDb, clearDb } from "./helpers/db";
import { authHeaders, createTestApp, registerAndLogin } from "./helpers/app";
import type { CollectionResponse, SeriesStatusResponse } from "shared";

const SERIES_ID = 1396;
const SERIES_NAME = "Breaking Bad";

function seriesBody(
  overrides: Partial<{
    tmdbId: number;
    season: number;
    episodes: number[];
    name: string;
    posterPath: string | null;
    totalEpisodes: number;
  }> = {}
) {
  return {
    tmdbId: SERIES_ID,
    season: 1,
    episodes: [1],
    name: SERIES_NAME,
    posterPath: null,
    totalEpisodes: 36,
    ...overrides,
  };
}

describe("collection series routes", () => {
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

  const putEpisodes = (episodes: number[], overrides: object = {}) =>
    app.inject({
      method: "PUT",
      url: "/collection/series/episode",
      headers: authHeaders(accessToken),
      payload: seriesBody({ episodes, ...overrides }),
    });

  const getStatus = () =>
    app.inject({
      method: "GET",
      url: `/collection/series/${SERIES_ID}`,
      headers: authHeaders(accessToken),
    });

  it("requires authentication", async () => {
    const putRes = await app.inject({
      method: "PUT",
      url: "/collection/series/episode",
      payload: seriesBody(),
    });
    expect(putRes.statusCode).toBe(401);

    const deleteRes = await app.inject({
      method: "DELETE",
      url: `/collection/series/${SERIES_ID}/episode?season=1&episode=1`,
    });
    expect(deleteRes.statusCode).toBe(401);
  });

  it("returns not watched before any episodes are marked", async () => {
    const res = await getStatus();
    expect(res.statusCode).toBe(200);
    expect(res.json<SeriesStatusResponse>()).toEqual({
      watched: false,
      watchedCount: 0,
      totalEpisodes: 0,
      watchedEpisodes: [],
    });
  });

  it("creates the series on the first episode check", async () => {
    const res = await putEpisodes([1, 2, 3]);

    expect(res.statusCode).toBe(200);
    expect(res.json<SeriesStatusResponse>()).toEqual({
      watched: true,
      watchedCount: 3,
      totalEpisodes: 36,
      watchedEpisodes: [
        { season: 1, episode: 1 },
        { season: 1, episode: 2 },
        { season: 1, episode: 3 },
      ],
    });

    const status = await getStatus();
    expect(status.json<SeriesStatusResponse>()).toMatchObject({
      watched: true,
      watchedCount: 3,
    });
  });

  it("batches a follow-up check without duplicating episodes", async () => {
    await putEpisodes([1, 2, 3]);

    const res = await putEpisodes([3, 4, 5]);
    const body = res.json<SeriesStatusResponse>();

    expect(body.watchedCount).toBe(5);
    // episode 3 is not duplicated
    expect(
      body.watchedEpisodes.filter((e) => e.season === 1 && e.episode === 3)
    ).toHaveLength(1);
  });

  it("ignores re-checking already watched episodes", async () => {
    await putEpisodes([1]);

    const res = await putEpisodes([1]);
    const body = res.json<SeriesStatusResponse>();

    expect(body.watchedCount).toBe(1);
  });

  it("updates totalEpisodes from the request body", async () => {
    await putEpisodes([1], { totalEpisodes: 20 });

    const res = await putEpisodes([2], { totalEpisodes: 40 });
    const body = res.json<SeriesStatusResponse>();

    expect(body.totalEpisodes).toBe(40);
  });

  it("updates the series watched date on every check", async () => {
    await putEpisodes([1]);

    const firstList = await app.inject({
      method: "GET",
      url: "/collection",
      headers: authHeaders(accessToken),
    });
    const firstWatchedAt = firstList.json<CollectionResponse>().series[0]!.watchedAt;

    await putEpisodes([2]);

    const secondList = await app.inject({
      method: "GET",
      url: "/collection",
      headers: authHeaders(accessToken),
    });
    const secondWatchedAt = secondList.json<CollectionResponse>().series[0]!.watchedAt;

    expect(new Date(secondWatchedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(firstWatchedAt).getTime()
    );
  });

  it("rejects an empty episodes array", async () => {
    const res = await putEpisodes([]);
    expect(res.statusCode).toBe(400);
  });

  it("rejects a missing name", async () => {
    const res = await app.inject({
      method: "PUT",
      url: "/collection/series/episode",
      headers: authHeaders(accessToken),
      payload: seriesBody({ name: "" }),
    });
    expect(res.statusCode).toBe(400);
  });

  it("unchecks a single episode", async () => {
    await putEpisodes([1, 2, 3]);

    const res = await app.inject({
      method: "DELETE",
      url: `/collection/series/${SERIES_ID}/episode?season=1&episode=2`,
      headers: authHeaders(accessToken),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<SeriesStatusResponse>();
    expect(body.watchedCount).toBe(2);
    expect(body.watchedEpisodes).toEqual([
      { season: 1, episode: 1 },
      { season: 1, episode: 3 },
    ]);
  });

  it("rejects an invalid episode query", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/collection/series/${SERIES_ID}/episode?season=not-a-number`,
      headers: authHeaders(accessToken),
    });

    expect(res.statusCode).toBe(400);
  });

  it("removes the series when the last episode is unchecked", async () => {
    await putEpisodes([1]);

    const res = await app.inject({
      method: "DELETE",
      url: `/collection/series/${SERIES_ID}/episode?season=1&episode=1`,
      headers: authHeaders(accessToken),
    });

    expect(res.json<SeriesStatusResponse>()).toEqual({
      watched: false,
      watchedCount: 0,
      totalEpisodes: 0,
      watchedEpisodes: [],
    });

    const status = await getStatus();
    expect(status.json()).toMatchObject({ watched: false, watchedCount: 0 });
  });

  it("deletes the whole series", async () => {
    await putEpisodes([1, 2, 3]);

    const firstDelete = await app.inject({
      method: "DELETE",
      url: `/collection/series/${SERIES_ID}`,
      headers: authHeaders(accessToken),
    });
    expect(firstDelete.statusCode).toBe(200);
    expect(firstDelete.json<{ watched: boolean }>()).toEqual({ watched: false });

    const secondDelete = await app.inject({
      method: "DELETE",
      url: `/collection/series/${SERIES_ID}`,
      headers: authHeaders(accessToken),
    });
    expect(secondDelete.statusCode).toBe(200);

    const status = await getStatus();
    expect(status.json<SeriesStatusResponse>()).toMatchObject({
      watched: false,
      watchedCount: 0,
    });
  });
});