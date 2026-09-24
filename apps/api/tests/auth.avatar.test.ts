import { afterAll, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import type { FastifyInstance } from "fastify";
import { startTestDb, stopTestDb, clearDb } from "./helpers/db";
import { createTestApp, registerAndLogin, authHeaders } from "./helpers/app";

const BOUNDARY = "----moviemark-avatar-boundary";

function multipartBody(
  fieldname: string,
  filename: string,
  contentType: string,
  content: Buffer
): Buffer {
  const header = Buffer.from(
    `--${BOUNDARY}\r\n` +
      `Content-Disposition: form-data; name="${fieldname}"; filename="${filename}"\r\n` +
      `Content-Type: ${contentType}\r\n\r\n`,
    "utf8"
  );
  const footer = Buffer.from(`\r\n--${BOUNDARY}--\r\n`, "utf8");
  return Buffer.concat([header, content, footer]);
}

const multipartHeaders = (token: string) => ({
  ...authHeaders(token),
  "content-type": `multipart/form-data; boundary=${BOUNDARY}`,
});

const PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52,
]);

describe("auth avatar routes", () => {
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

  it("uploads an avatar and returns it via /auth/me", async () => {
    const user = await registerAndLogin(app, "avatar@test.com");

    const res = await app.inject({
      method: "PUT",
      url: "/auth/avatar",
      headers: multipartHeaders(user.accessToken),
      payload: multipartBody("avatar", "me.png", "image/png", PNG_BYTES),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{
      user: { avatar: string };
      accessToken: string;
    }>();
    expect(body.accessToken).toBeTruthy();
    expect(body.user.avatar).toContain("data:image/png;base64,");

    const meRes = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: authHeaders(body.accessToken),
    });
    const me = meRes.json<{ avatar: string }>();
    expect(me.avatar).toBe(body.user.avatar);
  });

  it("rejects an upload that is not jpeg/png", async () => {
    const user = await registerAndLogin(app, "avatartype@test.com");

    const res = await app.inject({
      method: "PUT",
      url: "/auth/avatar",
      headers: multipartHeaders(user.accessToken),
      payload: multipartBody("avatar", "me.svg", "image/svg+xml", PNG_BYTES),
    });

    expect(res.statusCode).toBe(400);
    expect(res.json<{ error: string }>().error).toBe(
      "error.auth.avatar.invalidType"
    );
  });

  it("rejects a file larger than the avatar limit", async () => {
    const user = await registerAndLogin(app, "avatarlarge@test.com");
    const oversized = Buffer.alloc(2 * 1024 * 1024 + 1, 0x01);

    const res = await app.inject({
      method: "PUT",
      url: "/auth/avatar",
      headers: multipartHeaders(user.accessToken),
      payload: multipartBody("avatar", "big.png", "image/png", oversized),
    });

    expect(res.statusCode).toBe(400);
    expect(res.json<{ error: string }>().error).toBe(
      "error.auth.avatar.tooLarge"
    );
  });

  it("rejects an upload without a file field", async () => {
    const user = await registerAndLogin(app, "avatarmissing@test.com");

    const res = await app.inject({
      method: "PUT",
      url: "/auth/avatar",
      headers: multipartHeaders(user.accessToken),
      payload: multipartBody("notAvatar", "me.png", "image/png", PNG_BYTES),
    });

    expect(res.statusCode).toBe(400);
    expect(res.json<{ error: string }>().error).toBe(
      "error.auth.avatar.missingFile"
    );
  });

  it("rejects an upload without a token", async () => {
    const res = await app.inject({
      method: "PUT",
      url: "/auth/avatar",
      headers: { "content-type": `multipart/form-data; boundary=${BOUNDARY}` },
      payload: multipartBody("avatar", "me.png", "image/png", PNG_BYTES),
    });

    expect(res.statusCode).toBe(401);
  });
});