import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import type { FastifyInstance } from "fastify";
import { startTestDb, stopTestDb } from "./helpers/db";

let app: FastifyInstance;
let accessToken: string;
const originalFetch = globalThis.fetch;

beforeAll(async () => {
  process.env.TMDB_TOKEN = "eyJtest.token.proxy";
  await startTestDb();
  const { buildApp } = await import("../src/app");
  app = await buildApp();

  const registerRes = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: {
      name: "Test",
      surname: "User",
      email: "proxy@test.com",
      password: "password123",
    },
  });
  expect(registerRes.statusCode).toBe(201);

  const loginRes = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: { email: "proxy@test.com", password: "password123" },
  });
  expect(loginRes.statusCode).toBe(200);
  accessToken = loginRes.json<{ accessToken: string }>().accessToken;
});

afterAll(async () => {
  globalThis.fetch = originalFetch;
  await app?.close();
  await stopTestDb();
});

describe("tmdb proxy routes", () => {
  it("requires authentication", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/tmdb/movie/550",
    });
    expect(res.statusCode).toBe(401);
  });

  it("rejects paths outside the TMDB allowlist", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/tmdb/account",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json<{ error: string }>().error).toBe("error.tmdb.invalidPath");
  });

  it("rejects an invalid language", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/tmdb/movie/550?language=../../etc",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json<{ error: string }>().error).toBe(
      "error.tmdb.invalidLanguage"
    );
  });

  it("forwards an allowlisted path with the server-side token and passes through the response", async () => {
    let capturedUrl = "";
    globalThis.fetch = (async (input: unknown) => {
      capturedUrl = String(input);
      return new Response(JSON.stringify({ results: [{ id: 1 }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as unknown as typeof fetch;

    const res = await app.inject({
      method: "GET",
      url: "/tmdb/search/multi?query=matrix&language=en-US",
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json<{ results: { id: number }[] }>()).toEqual({
      results: [{ id: 1 }],
    });
    expect(capturedUrl).toContain(
      "https://api.themoviedb.org/3/search/multi"
    );
    expect(capturedUrl).toContain("query=matrix");
    expect(capturedUrl).toContain("language=en-US");
    expect(capturedUrl).not.toContain("api_key=");
  });

  it("passes through TMDB error statuses and bodies", async () => {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ status_code: 34, status_message: "Not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      })) as unknown as typeof fetch;

    const res = await app.inject({
      method: "GET",
      url: "/tmdb/movie/999999",
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json<{ status_code: number; status_message: string }>()).toEqual({
      status_code: 34,
      status_message: "Not found",
    });
  });
});