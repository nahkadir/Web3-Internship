import dotenv from "dotenv";
dotenv.config();

const required = ["MONGO_URI", "JWT_SECRET"];
for (const key of required) {
  if (!process.env[key])
    throw new Error(`Missing required env variable: ${key}`);
}

const nodeEnv = process.env.NODE_ENV || "development";
if (nodeEnv === "production" && process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters in production");
}

export const env = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  // one or more allowed frontend origins, comma-separated, no trailing slash
  clientUrls: (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim()),
  nodeEnv,
  cronSecret: process.env.CRON_SECRET,
  // number of reverse proxies in front of the app (Vercel proxy + Render = 2, Render only = 1)
  trustProxy: Number(process.env.TRUST_PROXY ?? 1),
};
