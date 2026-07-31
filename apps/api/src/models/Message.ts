import mongoose from "mongoose";

interface IMessage {
  text: string;
  createdAt?: Date;
}

const MessageSchema = new mongoose.Schema<IMessage>({
  text: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Message =
  (mongoose.models.Message as mongoose.Model<IMessage>) ||
  mongoose.model<IMessage>("Message", MessageSchema);
