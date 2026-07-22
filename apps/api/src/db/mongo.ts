import mongoose from "mongoose";

export async function connectMongo() {
  const uri = Bun.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI is missing");
  }

  await mongoose.connect(uri);

  console.log("Mongo connected");
   console.log("Database:", mongoose.connection.name);
}