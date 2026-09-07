import { afterAll, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import type { FastifyInstance } from "fastify";
import { startTestDb, stopTestDb, clearDb } from "./helpers/db";
import { createTestApp, registerAndLogin, authHeaders } from "./helpers/app";
import { config } from "../src/config";

function refreshTokenFromHeader(setCookie: string | undefined): string {
  const header = setCookie ?? "";
  const match = /refreshToken=([^;]+)/.exec(header);
  if (!match) {
    throw new Error("refreshToken cookie not found in set-cookie header");
  }
  return match[1]!;
}

describe("auth routes", () => {
  let app: FastifyInstance;

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
  });

  it("registers a new user", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        name: "Anna",
        surname: "Kowalska",
        email: "anna@test.com",
        password: "password123",
      },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json<{ message: string }>()).toEqual({
      message: "Registration successful",
    });
  });

  it("rejects duplicate email registration", async () => {
    await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        name: "Anna",
        surname: "Kowalska",
        email: "dupe@test.com",
        password: "password123",
      },
    });

    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        name: "Anna",
        surname: "Kowalska",
        email: "dupe@test.com",
        password: "password123",
      },
    });

    expect(res.statusCode).toBe(409);
    expect(res.json<{ error: string }>()).toEqual({
      error: "Email already registered",
    });
  });

  it("rejects registration with missing fields", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "nobody@test.com", password: "password123" },
    });

    expect(res.statusCode).toBe(400);
  });

  it("rejects registration with a short password", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        name: "Anna",
        surname: "Kowalska",
        email: "short@test.com",
        password: "123",
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it("logs in and returns user + tokens", async () => {
    const user = await registerAndLogin(app, "login@test.com");

    expect(user.accessToken).toBeTruthy();
    expect(user.refreshCookie).toContain("refreshToken=");

    const meRes = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: authHeaders(user.accessToken),
    });

    expect(meRes.statusCode).toBe(200);
    const body = meRes.json<{ id: string; name: string; surname: string; email: string }>();
    expect(body.email).toBe("login@test.com");
    expect(body.name).toBe("Test");
  });

  it("rejects login with a wrong password", async () => {
    await registerAndLogin(app, "wrongpw@test.com");

    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "wrongpw@test.com", password: "incorrect-password" },
    });

    expect(res.statusCode).toBe(401);
  });

  it("rejects login for an unknown email", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "missing@test.com", password: "password123" },
    });

    expect(res.statusCode).toBe(401);
  });

  it("returns 401 for /auth/me without a token", async () => {
    const res = await app.inject({ method: "GET", url: "/auth/me" });
    expect(res.statusCode).toBe(401);
  });

  it("refreshes the access token with a valid cookie", async () => {
    const user = await registerAndLogin(app, "refresh@test.com");
    const refreshToken = refreshTokenFromHeader(user.refreshCookie);

    const res = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      cookies: { [config.cookieName]: refreshToken },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json<{ accessToken: string }>().accessToken).toBeTruthy();
  });

  it("rejects refresh without a cookie", async () => {
    const res = await app.inject({ method: "POST", url: "/auth/refresh" });
    expect(res.statusCode).toBe(401);
  });

  it("logs out and clears the cookie", async () => {
    const user = await registerAndLogin(app, "logout@test.com");

    const res = await app.inject({
      method: "POST",
      url: "/auth/logout",
      cookies: { [config.cookieName]: refreshTokenFromHeader(user.refreshCookie) },
    });

    expect(res.statusCode).toBe(200);
    const rawSetCookie = res.headers["set-cookie"];
    const setCookie = Array.isArray(rawSetCookie)
      ? rawSetCookie.join("; ")
      : (rawSetCookie ?? "");
    expect(setCookie).toContain("refreshToken=");
    expect(/refreshToken=(?:;|$)/.test(setCookie)).toBe(true);
  });
});