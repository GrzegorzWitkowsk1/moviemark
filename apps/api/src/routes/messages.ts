import type { FastifyInstance } from "fastify";
import { Message } from "../models/Message";
import type {MessageType} from "../../../../packages/shared/index"

export async function messagesRoutes(
  app: FastifyInstance
) {

  app.get<{Reply: MessageType[]}>("/messages", async () => {
    const messages = await Message.find();

    return messages;
  });

}