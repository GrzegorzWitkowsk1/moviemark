import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;

beforeAll(async () => {
  const { buildApp } = await import("../src/app");
  app = await buildApp();
});

afterAll(async () => {
  await app?.close();
});

describe("health route", () => {
  it("returns ok without authentication", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(res.statusCode).toBe(200);
    expect(res.json<{ status: string }>()).toEqual({ status: "ok" });
  });
});