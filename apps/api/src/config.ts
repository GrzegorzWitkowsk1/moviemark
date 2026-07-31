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

export const config = {
  host: Bun.env.HOST ?? "0.0.0.0",
  port: number("PORT", 3000),
  mongoUri: required("MONGO_URI"),
  corsOrigin: Bun.env.CORS_ORIGIN ?? "http://localhost:5173",
};
