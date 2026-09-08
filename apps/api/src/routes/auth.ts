import type { FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";
import { Types } from "mongoose";
import { User } from "../models/User";
import type {
  AuthErrorResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  RegisterErrorResponse,
  RegisterRequest,
  RegisterResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
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
            .send({ error: "error.auth.register.emailTaken" });
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
          .send({ error: "error.internal" });
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
            remember: { type: "boolean" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { email, password, remember } = request.body;

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
          return reply
            .code(401)
            .send({ error: "error.auth.login.invalidCredentials" });
        }

        const valid = await Bun.password.verify(password, user.passwordHash);
        if (!valid) {
          return reply
            .code(401)
            .send({ error: "error.auth.login.invalidCredentials" });
        }

        const userData = toUserResponse(user);
        const accessToken = app.signAccessToken(userData);
        const refreshToken = app.signRefreshToken(userData.id, remember);
        app.setRefreshCookie(reply, refreshToken, remember);

        return reply.send({ user: userData, accessToken });
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "error.internal" });
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
        return reply.code(401).send({ error: "error.unauthorized" });
      }

      try {
        const payload = app.jwt.verify<{ userId: string }>(token);
        const user = await User.findById(payload.userId);
        if (!user) {
          return reply.code(401).send({ error: "error.unauthorized" });
        }

        const userData = toUserResponse(user);
        const accessToken = app.signAccessToken(userData);
        return reply.send({ accessToken });
      } catch (error) {
        request.log.error(error);
        return reply.code(401).send({ error: "error.unauthorized" });
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

  app.put<{
    Body: UpdateProfileRequest;
    Reply: UpdateProfileResponse | AuthErrorResponse;
  }>(
    "/auth/profile",
    {
      preHandler: app.authenticate,
      schema: {
        body: {
          type: "object",
          required: ["name", "surname", "email"],
          properties: {
            name: { type: "string", minLength: 1 },
            surname: { type: "string", minLength: 1 },
            email: { type: "string", format: "email" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { name, surname, email } = request.body;
        const uid = new Types.ObjectId(request.user.id);
        const normalizedEmail = email.toLowerCase();

        const existing = await User.findOne({
          email: normalizedEmail,
          _id: { $ne: uid },
        });
        if (existing) {
          return reply.code(409).send({ error: "error.auth.profile.emailTaken" });
        }

        const user = await User.findByIdAndUpdate(
          uid,
          { name, surname, email: normalizedEmail },
          { new: true }
        );
        if (!user) {
          return reply.code(404).send({ error: "error.auth.userNotFound" });
        }

        const userData = toUserResponse(user);
        const accessToken = app.signAccessToken(userData);
        return reply.send({ user: userData, accessToken });
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "error.internal" });
      }
    }
  );

  app.put<{
    Body: ChangePasswordRequest;
    Reply: ChangePasswordResponse | AuthErrorResponse;
  }>(
    "/auth/password",
    {
      preHandler: app.authenticate,
      schema: {
        body: {
          type: "object",
          required: ["newPassword"],
          properties: {
            newPassword: { type: "string", minLength: 8 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { newPassword } = request.body;
        const uid = new Types.ObjectId(request.user.id);

        const passwordHash = await Bun.password.hash(newPassword, {
          algorithm: "bcrypt",
        });

        const user = await User.findByIdAndUpdate(
          uid,
          { passwordHash },
          { new: true }
        );
        if (!user) {
          return reply.code(404).send({ error: "error.auth.userNotFound" });
        }

        return reply.send({ message: "Password changed successfully" });
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "error.internal" });
      }
    }
  );
}
