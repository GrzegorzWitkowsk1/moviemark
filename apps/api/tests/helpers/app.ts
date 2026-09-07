import type { FastifyInstance } from "fastify";
import { buildApp } from "../../src/app";
import type { LoginResponse } from "shared";

export function createTestApp(): Promise<FastifyInstance> {
  return buildApp();
}

let userCounter = 0;

export interface TestUser {
  email: string;
  password: string;
  accessToken: string;
  refreshCookie: string;
}

export async function registerAndLogin(
  app: FastifyInstance,
  email?: string
): Promise<TestUser> {
  userCounter += 1;
  const uniqueEmail = email ?? `user${userCounter}@test.com`;
  const password = "password123";

  const registerRes = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: {
      name: "Test",
      surname: "User",
      email: uniqueEmail,
      password,
    },
  });
  if (registerRes.statusCode !== 201) {
    throw new Error(
      `registerAndLogin: register failed (${registerRes.statusCode}): ${registerRes.body}`
    );
  }

  const loginRes = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: { email: uniqueEmail, password },
  });
  if (loginRes.statusCode !== 200) {
    throw new Error(
      `registerAndLogin: login failed (${loginRes.statusCode}): ${loginRes.body}`
    );
  }

  const body = loginRes.json<LoginResponse>();
  const rawSetCookie = loginRes.headers["set-cookie"];
  const setCookie = Array.isArray(rawSetCookie)
    ? rawSetCookie.join("; ")
    : (rawSetCookie ?? "");

  return {
    email: uniqueEmail,
    password,
    accessToken: body.accessToken,
    refreshCookie: setCookie,
  };
}

export function authHeaders(accessToken: string): Record<string, string> {
  return { authorization: `Bearer ${accessToken}` };
}