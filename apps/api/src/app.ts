import Fastify from "fastify";
import cors from "@fastify/cors";
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
        error: "error.invalidRequest",
      });
    }
    if (typeof err.statusCode === "number") {
      if (err.statusCode === 401) {
        return reply.code(401).send({ error: "error.unauthorized" });
      }
      return reply
        .code(err.statusCode)
        .send({ error: err.message || "error.requestFailed" });
    }
    request.log.error(error);
    return reply.code(500).send({ error: "error.internal" });
  });

  await app.register(cors, {
    origin: config.corsOrigin,
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "DELETE"],
  });

  await app.register(authPlugin);
  await app.register(authRoutes);
  await app.register(collectionRoutes);
  await app.register(customRoutes);
  await app.register(futureRoutes);

  return app;
}