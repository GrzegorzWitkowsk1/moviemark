import Fastify from "fastify";
import cors from "@fastify/cors";
import { messagesRoutes } from "./src/routes/messages";
import { connectMongo } from "./src/db/mongo";

const app = Fastify({
  logger: true,
});


async function start() {
  await connectMongo();

  await app.register(cors, {
    origin: "http://localhost:5173",
  });

  await app.register(messagesRoutes);


  await app.listen({
    port: 3000,
    host: "0.0.0.0",
  });
}


start();