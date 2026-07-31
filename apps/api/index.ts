import Fastify from "fastify";
import cors from "@fastify/cors";
import { messagesRoutes } from "./src/routes/messages";
import { authRoutes } from "./src/routes/auth";
import { connectMongo } from "./src/db/mongo";
import { config } from "./src/config";

const app = Fastify({
  logger: true,
});

app.setErrorHandler((error, request, reply) => {
  request.log.error(error);
  reply.code(500).send({ error: "Internal server error" });
});

async function start() {
  await connectMongo();

  await app.register(cors, {
    origin: config.corsOrigin,
  });

  await app.register(messagesRoutes);
  await app.register(authRoutes);

  await app.listen({
    port: config.port,
    host: config.host,
  });
}

start();
