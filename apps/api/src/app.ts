import Fastify from "fastify";
import cors from "@fastify/cors";
import { messagesRoutes } from "./routes/messages";
import { authRoutes } from "./routes/auth";
import { collectionRoutes } from "./routes/collection";
import { customRoutes } from "./routes/custom";
import { futureRoutes } from "./routes/future";
import { config } from "./config";
import authPlugin from "./plugins/auth";

export async function buildApp(options: { logger?: boolean } = {}) {
  const app = Fastify({
    logger: options.logger ?? false,
  });

  app.setErrorHandler((error: unknown, request, reply) => {
    const err = error as {
      validation?: { message?: string }[];
      statusCode?: number;
      message?: string;
    };
    if (err.validation) {
      return reply.code(400).send({
        error: err.validation[0]?.message ?? "Invalid request",
      });
    }
    if (typeof err.statusCode === "number") {
      return reply
        .code(err.statusCode)
        .send({ error: err.message || "Request failed" });
    }
    request.log.error(error);
    return reply.code(500).send({ error: "Internal server error" });
  });

  await app.register(cors, {
    origin: config.corsOrigin,
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "DELETE"],
  });

  await app.register(authPlugin);
  await app.register(messagesRoutes);
  await app.register(authRoutes);
  await app.register(collectionRoutes);
  await app.register(customRoutes);
  await app.register(futureRoutes);

  return app;
}