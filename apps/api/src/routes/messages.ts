import type { FastifyInstance } from "fastify";
import { Message } from "../models/Message";
import type { MessageType } from "shared";

export async function messagesRoutes(
  app: FastifyInstance
) {

  app.get<{ Reply: MessageType[] }>("/messages", async () => {
    const messages = await Message.find();

    return messages.map((message) => ({
      _id: message._id.toString(),
      text: message.text,
      createdAt: message.createdAt?.toISOString(),
    }));
  });

}