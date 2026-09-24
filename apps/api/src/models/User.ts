import mongoose from "mongoose";

interface IUser {
  name: string;
  surname: string;
  email: string;
  passwordHash: string;
  nextCustomId: number;
  avatar?: {
    data: Buffer;
    contentType: string;
  };
}

const AvatarSchema = new mongoose.Schema(
  {
    data: {
      type: Buffer,
      required: true,
    },
    contentType: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    nextCustomId: {
      type: Number,
      default: 1,
    },
    surname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    avatar: AvatarSchema,
  },
  {
    timestamps: true,
  }
);

export const User =
  (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);
