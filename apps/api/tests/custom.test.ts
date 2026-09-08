import { afterAll, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import type { FastifyInstance } from "fastify";
import { startTestDb, stopTestDb, clearDb } from "./helpers/db";
import { authHeaders, createTestApp, registerAndLogin } from "./helpers/app";

describe("custom routes", () => {
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
    const res = await app.inject({
      method: "POST",
      url: "/custom/movie",
      payload: { name: "My Movie" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("creates a custom movie and marks it watched", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/custom/movie",
      headers: authHeaders(accessToken),
      payload: {
        name: "My Movie",
        genreIds: [28, 12],
        year: "2020",
        runtimeMinutes: 120,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ customId: number; mediaType: string }>();
    expect(body.customId).toBeLessThan(0);
    expect(body.mediaType).toBe("movie");

    const collectionRes = await app.inject({
      method: "GET",
      url: "/collection",
      headers: authHeaders(accessToken),
    });
    const collection = collectionRes.json<{
      movies: { tmdbId: number; title: string }[];
    }>();
    const custom = collection.movies.find((m) => m.tmdbId < 0);
    expect(custom?.title).toBe("My Movie");
  });

  it("requires a movie name", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/custom/movie",
      headers: authHeaders(accessToken),
      payload: { name: "" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("creates a custom series with season 1 episode 1 watched", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/custom/series",
      headers: authHeaders(accessToken),
      payload: {
        name: "My Series",
        year: "2021",
        genreIds: [10765],
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

    expect(res.statusCode).toBe(200);
    const body = res.json<{ customId: number; totalEpisodes: number }>();
    expect(body.customId).toBeLessThan(0);
    expect(body.totalEpisodes).toBe(2);

    const statusRes = await app.inject({
      method: "GET",
      url: `/collection/series/${body.customId}`,
      headers: authHeaders(accessToken),
    });
    const status = statusRes.json<{
      watched: boolean;
      watchedCount: number;
      totalEpisodes: number;
      watchedEpisodes: { season: number; episode: number }[];
    }>();
    expect(status.watched).toBe(true);
    expect(status.watchedCount).toBe(1);
    expect(status.totalEpisodes).toBe(2);
    expect(status.watchedEpisodes).toEqual([{ season: 1, episode: 1 }]);
  });

  it("rejects a series without seasons", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/custom/series",
      headers: authHeaders(accessToken),
      payload: { name: "Empty Series", seasons: [] },
    });
    expect(res.statusCode).toBe(400);
  });

  it("rejects a series with a season that has no episodes", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/custom/series",
      headers: authHeaders(accessToken),
      payload: {
        name: "Bad Series",
        seasons: [{ seasonNumber: 1, episodes: [] }],
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it("assigns decrementing ids across two custom items", async () => {
    const first = await app.inject({
      method: "POST",
      url: "/custom/movie",
      headers: authHeaders(accessToken),
      payload: { name: "First" },
    });
    const second = await app.inject({
      method: "POST",
      url: "/custom/movie",
      headers: authHeaders(accessToken),
      payload: { name: "Second" },
    });
    const firstId = first.json<{ customId: number }>().customId;
    const secondId = second.json<{ customId: number }>().customId;
    expect(firstId).toBe(-1);
    expect(secondId).toBe(-2);
  });

  it("fetches a custom item for the details view", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/custom/series",
      headers: authHeaders(accessToken),
      payload: {
        name: "Fetchable",
        seasons: [{ seasonNumber: 3, episodes: [{ season: 3, episode: 1, name: "EP 1" }] }],
      },
    });
    const customId = created.json<{ customId: number }>().customId;

    const res = await app.inject({
      method: "GET",
      url: `/custom/${customId}?type=tv`,
      headers: authHeaders(accessToken),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ mediaType: string; name: string; seasons: { seasonNumber: number }[] }>();
    expect(body.mediaType).toBe("tv");
    expect(body.name).toBe("Fetchable");
    expect(body.seasons[0]?.seasonNumber).toBe(3);
  });

  it("allocates -1 for a pre-existing user missing nextCustomId", async () => {
    const meRes = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: authHeaders(accessToken),
    });
    const me = meRes.json<{ id: string }>();
    const { User } = await import("../src/models/User");
    await User.updateOne(
      { _id: me.id },
      { $unset: { nextCustomId: "" } }
    );

    const created = await app.inject({
      method: "POST",
      url: "/custom/movie",
      headers: authHeaders(accessToken),
      payload: { name: "PreExistingUser Movie" },
    });
    expect(created.statusCode).toBe(200);
    const customId = created.json<{ customId: number }>().customId;
    expect(customId).toBe(-1);
  });

  it("marks custom movie episodes as watched/unwatched via negative id", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/custom/series",
      headers: authHeaders(accessToken),
      payload: {
        name: "Toggleable Series",
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
    const customId = created.json<{ customId: number }>().customId;

    const putRes = await app.inject({
      method: "PUT",
      url: "/collection/series/episode",
      headers: authHeaders(accessToken),
      payload: {
        tmdbId: customId,
        season: 1,
        episodes: [2],
        name: "Toggleable Series",
        posterPath: null,
        totalEpisodes: 2,
      },
    });
    expect(putRes.statusCode).toBe(200);
    expect(
      putRes.json<{
        watchedCount: number;
        watchedEpisodes: { season: number; episode: number }[];
      }>().watchedEpisodes
    ).toEqual([
      { season: 1, episode: 1 },
      { season: 1, episode: 2 },
    ]);

    const unmarkRes = await app.inject({
      method: "DELETE",
      url: `/collection/series/${customId}/episode?season=1&episode=2`,
      headers: authHeaders(accessToken),
    });
    expect(unmarkRes.statusCode).toBe(200);
    expect(unmarkRes.json<{ watchedCount: number }>().watchedCount).toBe(1);
  });

  it("keeps custom movie metadata after unwatch and restores on re-watch", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/custom/movie",
      headers: authHeaders(accessToken),
      payload: { name: "Kept Movie", genreIds: [28], year: "1999" },
    });
    const customId = created.json<{ customId: number }>().customId;

    const unwatchRes = await app.inject({
      method: "DELETE",
      url: `/collection/movie/${customId}`,
      headers: authHeaders(accessToken),
    });
    expect(unwatchRes.statusCode).toBe(200);
    expect(unwatchRes.json<{ watched: boolean }>().watched).toBe(false);

    const rewatchRes = await app.inject({
      method: "POST",
      url: "/collection/movie",
      headers: authHeaders(accessToken),
      payload: { tmdbId: customId, title: "Kept Movie" },
    });
    expect(rewatchRes.statusCode).toBe(200);

    const collectionRes = await app.inject({
      method: "GET",
      url: "/collection",
      headers: authHeaders(accessToken),
    });
    const custom = collectionRes
      .json<{ movies: { tmdbId: number; genreIds?: number[]; year?: string }[] }>()
      .movies.find((m) => m.tmdbId === customId);
    expect(custom?.genreIds).toEqual([28]);
    expect(custom?.year).toBe("1999");
  });
});
