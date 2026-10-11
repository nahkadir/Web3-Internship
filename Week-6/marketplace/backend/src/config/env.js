import "dotenv/config";

const required = [
  "DATABASE_URL",
  "JWT_SECRET",
  "FRONTEND_URL",
  "BACKEND_URL",
  "PAYMENT_WEBHOOK_SECRET",
];
for (const key of required) {
  if (!process.env[key])
    throw new Error(`Missing environment variable: ${key}`);
}

if (
  process.env.NODE_ENV === "production" &&
  process.env.JWT_SECRET.length < 32
) {
  throw new Error("JWT_SECRET must be at least 32 characters in production");
}

const commissionRate = Number(process.env.COMMISSION_RATE ?? 0.1);
if (!(commissionRate >= 0 && commissionRate < 1)) {
  throw new Error("COMMISSION_RATE must be a number between 0 and 1");
}

// FRONTEND_URL may hold several comma-separated origins; the first one is used to build links
const frontendUrls = process.env.FRONTEND_URL.split(",").map((u) =>
  u.trim().replace(/\/$/, ""),
);

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  frontendUrl: frontendUrls[0],
  corsOrigins: frontendUrls,
  backendUrl: process.env.BACKEND_URL,
  trustProxyHops: Number(process.env.TRUST_PROXY_HOPS ?? 1),
  payment: {
    provider: process.env.PAYMENT_PROVIDER || "mock",
    allowMock: process.env.ALLOW_MOCK_PAYMENTS === "true",
    publicKey: process.env.PAYMENT_PUBLIC_KEY || "",
    secretKey: process.env.PAYMENT_SECRET_KEY || "",
    webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET,
    currency: process.env.PAYMENT_CURRENCY || "PKR",
    commissionRate,
    windowMinutes: Number(process.env.PAYMENT_WINDOW_MINUTES ?? 30),
  },
};
