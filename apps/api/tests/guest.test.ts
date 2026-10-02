import { afterAll, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import type { FastifyInstance } from "fastify";
import { Types } from "mongoose";
import { GUEST_EMAIL_DOMAIN, type LoginResponse } from "shared";
import { startTestDb, stopTestDb, clearDb } from "./helpers/db";
import { authHeaders, createTestApp, registerAndLogin } from "./helpers/app";
import { User } from "../src/models/User";
import { WatchedMovie } from "../src/models/WatchedMovie";
import { WatchedSeries } from "../src/models/WatchedSeries";
import { CustomMovie } from "../src/models/CustomMovie";
import { CustomSeries } from "../src/models/CustomSeries";
import { FutureMovie } from "../src/models/FutureMovie";
import { FutureSeries } from "../src/models/FutureSeries";
import {
  removeOrphanedUserData,
  sweepExpiredGuests,
} from "../src/services/guests";

interface GuestSession {
  id: string;
  accessToken: string;
  refreshCookie: string;
}

async function startGuest(app: FastifyInstance): Promise<GuestSession> {
  const res = await app.inject({ method: "POST", url: "/auth/guest" });
  if (res.statusCode !== 201) {
    throw new Error(`guest session failed (${res.statusCode}): ${res.body}`);
  }

  const body = res.json<LoginResponse>();
  const rawSetCookie = res.headers["set-cookie"];
  const refreshCookie = Array.isArray(rawSetCookie)
    ? rawSetCookie.join("; ")
    : (rawSetCookie ?? "");

  return {
    id: body.user.id,
    accessToken: body.accessToken,
    refreshCookie,
  };
}

function cookiePair(setCookie: string): string {
  return setCookie.split(";")[0] ?? "";
}

const PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52,
]);

async function seedGuestData(uid: Types.ObjectId) {
  await WatchedMovie.create({ userId: uid, tmdbId: 1, title: "Watched" });
  await WatchedSeries.create({
    userId: uid,
    tmdbId: 2,
    name: "Watched series",
    totalEpisodes: 3,
  });
  await FutureMovie.create({ userId: uid, tmdbId: 3, title: "Future" });
  await FutureSeries.create({ userId: uid, tmdbId: 4, name: "Future series" });
  await CustomMovie.create({ userId: uid, customId: -1, name: "Custom movie" });
  await CustomSeries.create({ userId: uid, customId: -2, name: "Custom series" });
}

async function countGuestData(uid: Types.ObjectId): Promise<number> {
  const counts = await Promise.all([
    WatchedMovie.countDocuments({ userId: uid }),
    WatchedSeries.countDocuments({ userId: uid }),
    FutureMovie.countDocuments({ userId: uid }),
    FutureSeries.countDocuments({ userId: uid }),
    CustomMovie.countDocuments({ userId: uid }),
    CustomSeries.countDocuments({ userId: uid }),
  ]);
  return counts.reduce((sum, value) => sum + value, 0);
}

describe("guest mode", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    await startTestDb();
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearDb();
  });

  it("creates a guest session with a session cookie and no Max-Age", async () => {
    const res = await app.inject({ method: "POST", url: "/auth/guest" });

    expect(res.statusCode).toBe(201);
    const body = res.json<LoginResponse>();
    expect(body.user.isGuest).toBe(true);
    expect(body.user.email.endsWith(`@${GUEST_EMAIL_DOMAIN}`)).toBe(true);
    expect(body.accessToken).toBeTruthy();

    const rawSetCookie = res.headers["set-cookie"];
    const setCookie = Array.isArray(rawSetCookie)
      ? rawSetCookie.join("; ")
      : (rawSetCookie ?? "");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).not.toContain("Max-Age=");
  });

  it("gives each guest session its own account", async () => {
    const first = await startGuest(app);
    const second = await startGuest(app);
    expect(first.id).not.toBe(second.id);
  });

  it("lets a guest use the collection, watchlist and statistics endpoints", async () => {
    const guest = await startGuest(app);
    const headers = authHeaders(guest.accessToken);

    const added = await app.inject({
      method: "POST",
      url: "/collection/movie",
      headers,
      payload: { tmdbId: 550, title: "Fight Club", rating: 9 },
    });
    expect(added.statusCode).toBe(200);

    const future = await app.inject({
      method: "POST",
      url: "/future/movie",
      headers,
      payload: { tmdbId: 680, title: "Fight Club", rating: 9 },
    });
    expect(future.statusCode).toBe(200);

    const collection = await app.inject({
      method: "GET",
      url: "/collection",
      headers,
    });
    expect(collection.json<{ movies: unknown[] }>().movies).toHaveLength(1);

    const stats = await app.inject({
      method: "GET",
      url: "/statistics",
      headers,
    });
    expect(stats.statusCode).toBe(200);
    expect(stats.json<{ watchedMovies: number }>().watchedMovies).toBe(1);

    const me = await app.inject({ method: "GET", url: "/auth/me", headers });
    expect(me.json<{ isGuest: boolean }>().isGuest).toBe(true);
  });

  it("keeps guest data isolated from regular users", async () => {
    const guest = await startGuest(app);
    const user = await registerAndLogin(app);

    await app.inject({
      method: "POST",
      url: "/collection/movie",
      headers: authHeaders(guest.accessToken),
      payload: { tmdbId: 550, title: "Guest movie", rating: 9 },
    });
    await app.inject({
      method: "POST",
      url: "/collection/movie",
      headers: authHeaders(user.accessToken),
      payload: { tmdbId: 550, title: "User movie", rating: 9 },
    });

    const guestCollection = await app.inject({
      method: "GET",
      url: "/collection",
      headers: authHeaders(guest.accessToken),
    });
    const guestMovies = guestCollection.json<{ movies: { title: string }[] }>()
      .movies;
    expect(guestMovies[0]?.title).toBe("Guest movie");

    const userCollection = await app.inject({
      method: "GET",
      url: "/collection",
      headers: authHeaders(user.accessToken),
    });
    const userMovies = userCollection.json<{ movies: { title: string }[] }>()
      .movies;
    expect(userMovies[0]?.title).toBe("User movie");
  });

  it("keeps the guest session alive across a refresh", async () => {
    const guest = await startGuest(app);

    const res = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      headers: { cookie: cookiePair(guest.refreshCookie) },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json<{ accessToken: string }>().accessToken).toBeTruthy();
  });

  it("allows a guest to change the name but not the email", async () => {
    const guest = await startGuest(app);
    const headers = authHeaders(guest.accessToken);
    const current = (
      await app.inject({ method: "GET", url: "/auth/me", headers })
    ).json<{ email: string }>();

    const renamed = await app.inject({
      method: "PUT",
      url: "/auth/profile",
      headers,
      payload: { name: "Guesty", surname: "Guest", email: current.email },
    });
    expect(renamed.statusCode).toBe(200);

    const rejected = await app.inject({
      method: "PUT",
      url: "/auth/profile",
      headers,
      payload: { name: "Guesty", surname: "Guest", email: "someone@example.com" },
    });
    expect(rejected.statusCode).toBe(403);
    expect(rejected.json<{ error: string }>().error).toBe(
      "error.auth.guest.emailRestricted"
    );
  });

  it("blocks password changes for guests", async () => {
    const guest = await startGuest(app);

    const res = await app.inject({
      method: "PUT",
      url: "/auth/password",
      headers: authHeaders(guest.accessToken),
      payload: { newPassword: "password123" },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json<{ error: string }>().error).toBe(
      "error.auth.guest.passwordRestricted"
    );
  });

  it("allows a guest to upload an avatar", async () => {
    const guest = await startGuest(app);

    const boundary = "----moviemark-guest-boundary";
    const payload = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\n` +
          'Content-Disposition: form-data; name="avatar"; filename="a.png"\r\n' +
          "Content-Type: image/png\r\n\r\n",
        "utf8"
      ),
      PNG_BYTES,
      Buffer.from(`\r\n--${boundary}--\r\n`, "utf8"),
    ]);

    const res = await app.inject({
      method: "PUT",
      url: "/auth/avatar",
      headers: {
        ...authHeaders(guest.accessToken),
        "content-type": `multipart/form-data; boundary=${boundary}`,
      },
      payload,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json<{ user: { isGuest: boolean } }>().user.isGuest).toBe(true);
  });

  it("does not allow a guest email to be registered", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        name: "Anna",
        surname: "Kowalska",
        email: `someone@${GUEST_EMAIL_DOMAIN}`,
        password: "password123",
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json<{ error: string }>().error).toBe(
      "error.auth.register.reservedEmail"
    );
  });

  it("does not allow logging in with a guest account", async () => {
    const guest = await startGuest(app);
    const user = await User.findById(guest.id);
    expect(user?.passwordHash).toBeUndefined();

    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: user?.email, password: "password123" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("deletes the guest account and all of its data on guest end", async () => {
    const guest = await startGuest(app);
    const uid = new Types.ObjectId(guest.id);
    await seedGuestData(uid);
    expect(await countGuestData(uid)).toBe(6);

    const res = await app.inject({
      method: "POST",
      url: "/auth/guest/end",
      payload: { accessToken: guest.accessToken },
    });

    expect(res.statusCode).toBe(200);
    expect(await User.findById(uid)).toBeNull();
    expect(await countGuestData(uid)).toBe(0);
  });

  it("rejects guest end with a missing, invalid or non-guest token", async () => {
    const user = await registerAndLogin(app);

    expect(
      (
        await app.inject({
          method: "POST",
          url: "/auth/guest/end",
          payload: {},
        })
      ).statusCode
    ).toBe(400);

    expect(
      (
        await app.inject({
          method: "POST",
          url: "/auth/guest/end",
          payload: { accessToken: "not-a-token" },
        })
      ).statusCode
    ).toBe(401);

    expect(
      (
        await app.inject({
          method: "POST",
          url: "/auth/guest/end",
          payload: { accessToken: user.accessToken },
        })
      ).statusCode
    ).toBe(401);

    expect(await User.findOne({ email: user.email })).not.toBeNull();
  });

  it("reaps expired guests together with their data", async () => {
    const guest = await startGuest(app);
    const uid = new Types.ObjectId(guest.id);
    await seedGuestData(uid);

    await User.updateOne(
      { _id: uid },
      { $set: { guestExpiresAt: new Date(Date.now() - 60_000) } }
    );

    const purged = await sweepExpiredGuests();
    expect(purged).toBe(1);
    expect(await User.findById(uid)).toBeNull();
    expect(await countGuestData(uid)).toBe(0);
  });

  it("keeps unexpired guests during the sweep", async () => {
    const guest = await startGuest(app);

    expect(await sweepExpiredGuests()).toBe(0);
    expect(await User.findById(guest.id)).not.toBeNull();
  });

  it("removes data of users that no longer exist", async () => {
    const user = await registerAndLogin(app);
    const stored = await User.findOne({ email: user.email });
    const uid = stored?._id as Types.ObjectId;
    await seedGuestData(uid);
    expect(await countGuestData(uid)).toBe(6);

    await User.findByIdAndDelete(uid);
    await removeOrphanedUserData();

    expect(await countGuestData(uid)).toBe(0);
  });

  it("rejects a refresh for an expired guest and purges the account", async () => {
    const guest = await startGuest(app);
    const uid = new Types.ObjectId(guest.id);
    await User.updateOne(
      { _id: uid },
      { $set: { guestExpiresAt: new Date(Date.now() - 1000) } }
    );

    const res = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      headers: { cookie: cookiePair(guest.refreshCookie) },
    });

    expect(res.statusCode).toBe(401);
    expect(await User.findById(uid)).toBeNull();
  });
});