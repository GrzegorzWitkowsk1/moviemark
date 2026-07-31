import mongoose from "mongoose";
import { config } from "../config";

export async function connectMongo() {
  await mongoose.connect(config.mongoUri);

  console.log("Mongo connected");
  console.log("Database:", mongoose.connection.name);
}
