import type { FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";
import { User } from "../models/User";
import type {
  RegisterErrorResponse,
  RegisterRequest,
  RegisterResponse,
} from "shared";

export async function authRoutes(app: FastifyInstance) {
  await app.register(rateLimit, {
    max: 100,
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
}
