function required(name: string): string {
  const value = Bun.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function number(name: string, fallback: number): number {
  const raw = Bun.env[name];
  if (!raw) {
    return fallback;
  }
  const value = Number(raw);
  if (Number.isNaN(value)) {
    throw new Error(`Invalid numeric environment variable: ${name}`);
  }
  return value;
}

function resolveJwtSecret(): string {
  const candidate = Bun.env.JWT_SECRET;
  const production = Bun.env.NODE_ENV === "production";
  if (!candidate) {
    if (production) {
      throw new Error(
        "Missing required environment variable: JWT_SECRET"
      );
    }
    return "dev-secret";
  }
  if (candidate === "dev-secret" && production) {
    throw new Error(
      "JWT_SECRET must not be the default dev-secret in production"
    );
  }
  return candidate;
}

export const config = {
  host: Bun.env.HOST ?? "0.0.0.0",
  port: number("PORT", 3000),
  mongoUri: required("MONGO_URI"),
  corsOrigin: Bun.env.CORS_ORIGIN ?? "http://localhost:5173",
  jwtSecret: resolveJwtSecret(),
  accessTokenTtl: Bun.env.ACCESS_TOKEN_TTL ?? "15m",
  refreshTokenTtl: Bun.env.REFRESH_TOKEN_TTL ?? "7d",
  cookieName: Bun.env.COOKIE_NAME ?? "refreshToken",
  rateLimitMax: number("RATE_LIMIT_MAX", 100),
  tmdbRateLimitMax: number("TMDB_RATE_LIMIT_MAX", 30),
  isProduction: Bun.env.NODE_ENV === "production",
  tmdbApiBase: Bun.env.TMDB_API_BASE ?? "https://api.themoviedb.org/3",
  tmdbToken: Bun.env.TMDB_TOKEN ?? "",
};
