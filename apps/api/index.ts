import { buildApp } from "./src/app";
import { connectMongo } from "./src/db/mongo";
import { config } from "./src/config";

async function start() {
  await connectMongo();

  const app = await buildApp({ logger: true });

  await app.listen({
    port: config.port,
    host: config.host,
  });
}

start();