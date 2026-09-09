import { Types } from "mongoose";

export function parseTmdbId(raw: string): number {
  const id = Number(raw);
  if (!Number.isFinite(id) || id === 0) {
    const err = new Error("error.invalidTmdbId") as Error & {
      statusCode: number;
    };
    err.statusCode = 400;
    throw err;
  }
  return id;
}

export function userId(request: { user: { id: string } }): Types.ObjectId {
  return new Types.ObjectId(request.user.id);
}