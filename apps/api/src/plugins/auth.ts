import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import cookie from "@fastify/cookie";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { config } from "../config";
import type { UserResponse } from "shared";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { id?: string; userId?: string; name?: string; surname?: string; email?: string };
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
    signRefreshToken: (userId: string) => string;
    setRefreshCookie: (reply: FastifyReply, token: string) => void;
    clearRefreshCookie: (reply: FastifyReply) => void;
  }
}

export default fp(
  async function authPlugin(app: FastifyInstance) {
    await app.register(jwt, {
      secret: config.jwtSecret,
    });

    await app.register(cookie);

    app.decorate("authenticate", async (request, reply) => {
      try {
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
      } catch {
        reply.code(401).send({ error: "Unauthorized" });
      }
    });

    app.decorate("signAccessToken", (payload: UserResponse) =>
      app.jwt.sign(payload, { expiresIn: config.accessTokenTtl })
    );

    app.decorate("signRefreshToken", (userId: string) =>
      app.jwt.sign({ userId }, { expiresIn: config.refreshTokenTtl })
    );

    app.decorate("setRefreshCookie", (reply: FastifyReply, token: string) => {
      reply.setCookie(config.cookieName, token, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    });

    app.decorate("clearRefreshCookie", (reply: FastifyReply) => {
      reply.clearCookie(config.cookieName, { path: "/" });
    });
  },
  { name: "auth" }
);
