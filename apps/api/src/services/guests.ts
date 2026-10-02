import { Types } from "mongoose";
import { GUEST_EMAIL_DOMAIN } from "shared";
import { config } from "../config";
import { User } from "../models/User";
import { WatchedMovie } from "../models/WatchedMovie";
import { WatchedSeries } from "../models/WatchedSeries";
import { CustomMovie } from "../models/CustomMovie";
import { CustomSeries } from "../models/CustomSeries";
import { FutureMovie } from "../models/FutureMovie";
import { FutureSeries } from "../models/FutureSeries";

interface DeletableModel {
  deleteMany: (filter: Record<string, unknown>) => Promise<unknown>;
}

const USER_DATA_MODELS: DeletableModel[] = [
  WatchedMovie,
  WatchedSeries,
  CustomMovie,
  CustomSeries,
  FutureMovie,
  FutureSeries,
];

export function guestEmail(): string {
  return `guest-${crypto.randomUUID()}@${GUEST_EMAIL_DOMAIN}`;
}

export function guestExpiry(): Date {
  return new Date(Date.now() + config.guestTtlMinutes * 60 * 1000);
}

export async function createGuest(): Promise<Types.ObjectId> {
  const user = await User.create({
    name: "Guest",
    surname: "Account",
    email: guestEmail(),
    isGuest: true,
    guestExpiresAt: guestExpiry(),
  });
  return user._id;
}

export async function purgeGuest(uid: Types.ObjectId): Promise<void> {
  await Promise.all(
    USER_DATA_MODELS.map((model) => model.deleteMany({ userId: uid }))
  );
  await User.findByIdAndDelete(uid);
}

export async function purgeExpiredGuest(uid: Types.ObjectId): Promise<void> {
  await User.findOneAndDelete({ _id: uid, isGuest: true });
  await Promise.all(
    USER_DATA_MODELS.map((model) => model.deleteMany({ userId: uid }))
  );
}

export async function sweepExpiredGuests(): Promise<number> {
  const expired = await User.find({
    isGuest: true,
    guestExpiresAt: { $lte: new Date() },
  }).select("_id");

  for (const guest of expired) {
    await purgeExpiredGuest(guest._id as Types.ObjectId);
  }

  await removeOrphanedUserData();

  return expired.length;
}

export async function removeOrphanedUserData(): Promise<void> {
  const users = await User.find({}).select("_id");
  const existingIds = users.map((user) => user._id as Types.ObjectId);

  await Promise.all(
    USER_DATA_MODELS.map((model) =>
      model.deleteMany({ userId: { $nin: existingIds } })
    )
  );
}

export function startGuestSweep(intervalMs = 5 * 60 * 1000): NodeJS.Timeout {
  const sweep = () => {
    sweepExpiredGuests().catch((error) => {
      console.error("guest sweep failed", error);
    });
  };

  sweep();

  const timer = setInterval(sweep, intervalMs);
  timer.unref?.();
  return timer;
}