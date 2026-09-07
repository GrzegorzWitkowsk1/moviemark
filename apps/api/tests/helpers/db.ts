import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer: MongoMemoryServer | null = null;

export async function startTestDb() {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri("moviemark-test"));
}

export async function stopTestDb() {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
}

export async function clearDb() {
  const collections = await mongoose.connection.db?.collections();
  if (!collections) {
    return;
  }
  await Promise.all(
    collections.map((collection) => collection.deleteMany({}))
  );
}