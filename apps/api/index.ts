import { buildApp } from "./src/app";
import { connectMongo } from "./src/db/mongo";
import { config } from "./src/config";
import { startGuestSweep } from "./src/services/guests";

async function start() {
  await connectMongo();

  startGuestSweep();

  const app = await buildApp({ logger: true });

  await app.listen({
    port: config.port,
    host: config.host,
  });
}

start();