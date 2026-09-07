import type { FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";
import { User } from "../models/User";
import type {
  AuthErrorResponse,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  RegisterErrorResponse,
  RegisterRequest,
  RegisterResponse,
  UserResponse,
} from "shared";
import { config } from "../config";

function toUserResponse(user: {
  _id: unknown;
  name: string;
  surname: string;
  email: string;
}): UserResponse {
  return {
    id: String(user._id),
    name: user.name,
    surname: user.surname,
    email: user.email,
  };
}

export async function authRoutes(app: FastifyInstance) {
  await app.register(rateLimit, {
    max: config.rateLimitMax,
    timeWindow: "1 minute",
  });

  app.post<{
    Body: RegisterRequest;
    Reply: RegisterResponse | RegisterErrorResponse;
  }>(
    "/auth/register",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "surname", "email", "password"],
          properties: {
            name: { type: "string", minLength: 1 },
            surname: { type: "string", minLength: 1 },
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 8 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { name, surname, email, password } = request.body;

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
          return reply
            .code(409)
            .send({ error: "Email already registered" });
        }

        const passwordHash = await Bun.password.hash(password, {
          algorithm: "bcrypt",
        });

        await User.create({
          name,
          surname,
          email: email.toLowerCase(),
          passwordHash,
        });

        return reply
          .code(201)
          .send({ message: "Registration successful" });
      } catch (error) {
        request.log.error(error);
        return reply
          .code(500)
          .send({ error: "Internal server error" });
      }
    }
  );

  app.post<{
    Body: LoginRequest;
    Reply: LoginResponse | AuthErrorResponse;
  }>(
    "/auth/login",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { email, password } = request.body;

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
          return reply.code(401).send({ error: "Invalid email or password" });
        }

        const valid = await Bun.password.verify(password, user.passwordHash);
        if (!valid) {
          return reply.code(401).send({ error: "Invalid email or password" });
        }

        const userData = toUserResponse(user);
        const accessToken = app.signAccessToken(userData);
        const refreshToken = app.signRefreshToken(userData.id);
        app.setRefreshCookie(reply, refreshToken);

        return reply.send({ user: userData, accessToken });
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Internal server error" });
      }
    }
  );

  app.post<{
    Reply: RefreshResponse | AuthErrorResponse;
  }>(
    "/auth/refresh",
    async (request, reply) => {
      const token = request.cookies[config.cookieName];
      if (!token) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      try {
        const payload = app.jwt.verify<{ userId: string }>(token);
        const user = await User.findById(payload.userId);
        if (!user) {
          return reply.code(401).send({ error: "Unauthorized" });
        }

        const userData = toUserResponse(user);
        const accessToken = app.signAccessToken(userData);
        return reply.send({ accessToken });
      } catch (error) {
        request.log.error(error);
        return reply.code(401).send({ error: "Unauthorized" });
      }
    }
  );

  app.post<{
    Reply: { message: string } | AuthErrorResponse;
  }>("/auth/logout", async (_request, reply) => {
    app.clearRefreshCookie(reply);
    return reply.send({ message: "Logged out" });
  });

  app.get<{
    Reply: UserResponse | AuthErrorResponse;
  }>(
    "/auth/me",
    { preHandler: app.authenticate },
    async (request) => {
      return request.user;
    }
  );
}
