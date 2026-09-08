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

  it("updates the profile and returns a fresh token", async () => {
    const user = await registerAndLogin(app, "profile@test.com");

    const res = await app.inject({
      method: "PUT",
      url: "/auth/profile",
      headers: authHeaders(user.accessToken),
      payload: { name: "Anna", surname: "Nowak", email: "anna.new@test.com" },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ user: { name: string; surname: string; email: string }; accessToken: string }>();
    expect(body.user.name).toBe("Anna");
    expect(body.user.surname).toBe("Nowak");
    expect(body.user.email).toBe("anna.new@test.com");
    expect(body.accessToken).toBeTruthy();

    const meRes = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: authHeaders(body.accessToken),
    });
    const me = meRes.json<{ name: string; email: string }>();
    expect(me.name).toBe("Anna");
    expect(me.email).toBe("anna.new@test.com");
  });

  it("rejects profile update without a token", async () => {
    const res = await app.inject({
      method: "PUT",
      url: "/auth/profile",
      payload: { name: "Anna", surname: "Nowak", email: "a@test.com" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("rejects profile update when email is taken by another user", async () => {
    await registerAndLogin(app, "taken@test.com");
    const user = await registerAndLogin(app, "owner@test.com");

    const res = await app.inject({
      method: "PUT",
      url: "/auth/profile",
      headers: authHeaders(user.accessToken),
      payload: { name: "Anna", surname: "Nowak", email: "taken@test.com" },
    });

    expect(res.statusCode).toBe(409);
    expect(res.json<{ error: string }>().error).toBe("Email already registered");
  });

  it("rejects an invalid profile body", async () => {
    const user = await registerAndLogin(app, "badprofile@test.com");

    const res = await app.inject({
      method: "PUT",
      url: "/auth/profile",
      headers: authHeaders(user.accessToken),
      payload: { name: "", surname: "Nowak", email: "bad@test.com" },
    });

    expect(res.statusCode).toBe(400);
  });

  it("changes the password and allows login with the new password", async () => {
    const user = await registerAndLogin(app, "pw@test.com");

    const res = await app.inject({
      method: "PUT",
      url: "/auth/password",
      headers: authHeaders(user.accessToken),
      payload: { newPassword: "newpassword123" },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json<{ message: string }>().message).toBe(
      "Password changed successfully"
    );

    const newLogin = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: user.email, password: "newpassword123" },
    });
    expect(newLogin.statusCode).toBe(200);

    const oldLogin = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: user.email, password: "password123" },
    });
    expect(oldLogin.statusCode).toBe(401);
  });

  it("rejects password change without a token", async () => {
    const res = await app.inject({
      method: "PUT",
      url: "/auth/password",
      payload: { newPassword: "newpassword123" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("rejects a short new password", async () => {
    const user = await registerAndLogin(app, "shortpw@test.com");

    const res = await app.inject({
      method: "PUT",
      url: "/auth/password",
      headers: authHeaders(user.accessToken),
      payload: { newPassword: "123" },
    });

    expect(res.statusCode).toBe(400);
  });

  async function maxAgeWithRemember(
    email: string,
    remember: boolean
  ): Promise<string> {
    await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        name: "Remember",
        surname: "Test",
        email,
        password: "password123",
      },
    });
    const loginRes = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email, password: "password123", remember },
    });
    expect(loginRes.statusCode).toBe(200);
    const rawSetCookie = loginRes.headers["set-cookie"];
    const setCookie = Array.isArray(rawSetCookie)
      ? rawSetCookie.join("; ")
      : (rawSetCookie ?? "");
    const maxAge = setCookie.split("; ").find((p) => p.startsWith("Max-Age="));
    expect(maxAge).toBeTruthy();
    return maxAge!;
  }

  it("sets a 7-day refresh cookie when remember is true", async () => {
    const maxAge = await maxAgeWithRemember("remembertrue@test.com", true);
    expect(maxAge).toBe("Max-Age=604800");
  });

  it("sets a 1-day refresh cookie when remember is false", async () => {
    const maxAge = await maxAgeWithRemember("rememberfalse@test.com", false);
    expect(maxAge).toBe("Max-Age=86400");
  });
});