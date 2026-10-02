import type { FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";
import multipart from "@fastify/multipart";
import { Types } from "mongoose";
import { User } from "../models/User";
import type {
  AuthErrorResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  GuestEndRequest,
  GuestEndResponse,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  RegisterErrorResponse,
  RegisterRequest,
  RegisterResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  UploadAvatarResponse,
  UserResponse,
} from "shared";
import { AVATAR_ALLOWED_MIME, AVATAR_MAX_BYTES, GUEST_EMAIL_DOMAIN } from "shared";
import { config } from "../config";
import { createGuest, purgeExpiredGuest, purgeGuest } from "../services/guests";

function avatarToDataUrl(avatar: {
  data: Buffer;
  contentType: string;
}): string {
  return `data:${avatar.contentType};base64,${avatar.data.toString("base64")}`;
}

function toUserResponse(user: {
  _id: unknown;
  name: string;
  surname: string;
  email: string;
  isGuest?: boolean;
  avatar?: {
    data: Buffer;
    contentType: string;
  };
}): UserResponse {
  return {
    id: String(user._id),
    name: user.name,
    surname: user.surname,
    email: user.email,
    avatar: user.avatar ? avatarToDataUrl(user.avatar) : null,
    isGuest: user.isGuest === true,
  };
}

export async function authRoutes(app: FastifyInstance) {
  await app.register(rateLimit, {
    max: config.rateLimitMax,
    timeWindow: "1 minute",
  });

  await app.register(multipart, {
    limits: {
      fileSize: AVATAR_MAX_BYTES,
      files: 1,
      fields: 0,
    },
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
      config: { rateLimit: { max: config.isProduction ? 10 : config.rateLimitMax, timeWindow: "1 minute" } },
    },
    async (request, reply) => {
      try {
        const { name, surname, email, password } = request.body;

        if (email.toLowerCase().endsWith(`@${GUEST_EMAIL_DOMAIN}`)) {
          return reply
            .code(400)
            .send({ error: "error.auth.register.reservedEmail" });
        }

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
      config: { rateLimit: { max: config.isProduction ? 10 : config.rateLimitMax, timeWindow: "1 minute" } },
    },
    async (request, reply) => {
      try {
        const { email, password, remember } = request.body;

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || user.isGuest || !user.passwordHash) {
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
    Reply: LoginResponse | AuthErrorResponse;
  }>(
    "/auth/guest",
    {
      config: {
        rateLimit: {
          max: config.guestRateLimitMax,
          timeWindow: "1 hour",
        },
      },
    },
    async (request, reply) => {
      try {
        const uid = await createGuest();
        const guest = await User.findById(uid);
        if (!guest) {
          return reply.code(500).send({ error: "error.internal" });
        }

        const userData = toUserResponse(guest);
        const accessToken = app.signAccessToken(userData);
        const refreshToken = app.signRefreshToken(userData.id);
        app.setSessionCookie(reply, refreshToken);

        return reply.code(201).send({ user: userData, accessToken });
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "error.internal" });
      }
    }
  );

  app.post<{
    Body: GuestEndRequest;
    Reply: GuestEndResponse | AuthErrorResponse;
  }>(
    "/auth/guest/end",
    {
      schema: {
        body: {
          type: "object",
          required: ["accessToken"],
          properties: {
            accessToken: { type: "string", minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      let payload: { id?: string; isGuest?: boolean };
      try {
        payload = app.jwt.verify(request.body.accessToken);
      } catch {
        return reply.code(401).send({ error: "error.unauthorized" });
      }

      if (!payload.id || payload.isGuest !== true) {
        return reply.code(401).send({ error: "error.unauthorized" });
      }

      try {
        await purgeGuest(new Types.ObjectId(payload.id));
        app.clearRefreshCookie(reply);
        return reply.send({ message: "Guest session ended" });
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
      const origin = request.headers.origin;
      if (origin && origin !== config.corsOrigin) {
        return reply.code(403).send({ error: "error.unauthorized" });
      }

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

        if (
          user.isGuest &&
          user.guestExpiresAt &&
          user.guestExpiresAt.getTime() <= Date.now()
        ) {
          await purgeExpiredGuest(user._id as Types.ObjectId);
          app.clearRefreshCookie(reply);
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
    async (request, reply) => {
      const user = await User.findById(request.user.id);
      if (!user) {
        return reply.code(404).send({ error: "error.auth.userNotFound" });
      }
      return toUserResponse(user);
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

        if (
          request.user.isGuest === true &&
          normalizedEmail !== request.user.email.toLowerCase()
        ) {
          return reply
            .code(403)
            .send({ error: "error.auth.guest.emailRestricted" });
        }

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
    Reply: UploadAvatarResponse | AuthErrorResponse;
  }>(
    "/auth/avatar",
    {
      preHandler: app.authenticate,
      config: { rateLimit: { max: config.isProduction ? 10 : config.rateLimitMax, timeWindow: "1 minute" } },
    },
    async (request, reply) => {
      try {
        if (!request.isMultipart()) {
          return reply.code(400).send({ error: "error.auth.avatar.missingFile" });
        }

        const file = await request.file();
        if (!file || file.fieldname !== "avatar") {
          return reply.code(400).send({ error: "error.auth.avatar.missingFile" });
        }

        if (
          !(AVATAR_ALLOWED_MIME as readonly string[]).includes(file.mimetype)
        ) {
          return reply.code(400).send({ error: "error.auth.avatar.invalidType" });
        }

        let buffer: Buffer;
        try {
          buffer = await file.toBuffer();
        } catch (error) {
          const err = error as { code?: string };
          if (err.code === "FST_REQ_FILE_TOO_LARGE") {
            return reply.code(400).send({ error: "error.auth.avatar.tooLarge" });
          }
          throw error;
        }

        if (buffer.byteLength > AVATAR_MAX_BYTES) {
          return reply.code(400).send({ error: "error.auth.avatar.tooLarge" });
        }

        const uid = new Types.ObjectId(request.user.id);
        const user = await User.findByIdAndUpdate(
          uid,
          { avatar: { data: buffer, contentType: file.mimetype } },
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

        if (request.user.isGuest === true) {
          return reply
            .code(403)
            .send({ error: "error.auth.guest.passwordRestricted" });
        }

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
