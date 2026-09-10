import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import cookie from "@fastify/cookie";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { config } from "../config";
import type { UserResponse } from "shared";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      id?: string;
      userId?: string;
      remember?: boolean;
      name?: string;
      surname?: string;
      email?: string;
    };
    user: UserResponse;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
    signAccessToken: (payload: UserResponse) => string;
    signRefreshToken: (userId: string, remember?: boolean) => string;
    setRefreshCookie: (
      reply: FastifyReply,
      token: string,
      remember?: boolean
    ) => void;
    clearRefreshCookie: (reply: FastifyReply) => void;
  }
}

export function refreshCookieAttributes(remember: boolean, isProduction: boolean) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    path: "/",
    maxAge: remember ? 60 * 60 * 24 * 7 : 60 * 60 * 24 * 1,
  };
}

export default fp(
  async function authPlugin(app: FastifyInstance) {
    await app.register(jwt, {
      secret: config.jwtSecret,
    });

    await app.register(cookie);

    app.decorate("authenticate", async (request) => {
      const payload = await request.jwtVerify<{
        id: string;
        name: string;
        surname: string;
        email: string;
      }>();
      request.user = {
        id: payload.id,
        name: payload.name,
        surname: payload.surname,
        email: payload.email,
      };
    });

    app.decorate("signAccessToken", (payload: UserResponse) =>
      app.jwt.sign(payload, { expiresIn: config.accessTokenTtl })
    );

    app.decorate("signRefreshToken", (userId: string, remember?: boolean) =>
      app.jwt.sign(
        { userId, remember },
        { expiresIn: remember ? config.refreshTokenTtl : "1d" }
      )
    );

    app.decorate(
      "setRefreshCookie",
      (reply: FastifyReply, token: string, remember?: boolean) => {
        reply.setCookie(config.cookieName, token, {
          ...refreshCookieAttributes(remember ?? false, config.isProduction),
        });
      }
    );

    app.decorate("clearRefreshCookie", (reply: FastifyReply) => {
      reply.clearCookie(config.cookieName, {
        path: "/",
        secure: config.isProduction,
        sameSite: config.isProduction ? "none" : "lax",
      });
    });
  },
  { name: "auth" }
);
