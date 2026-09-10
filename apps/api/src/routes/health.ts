import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", { logLevel: "warn" }, async (_request, reply) => {
    return reply.send({ status: "ok" });
  });
}