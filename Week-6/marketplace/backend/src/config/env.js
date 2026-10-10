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

const commissionRate = Number(process.env.COMMISSION_RATE ?? 0.1);
if (!(commissionRate >= 0 && commissionRate < 1)) {
  throw new Error("COMMISSION_RATE must be a number between 0 and 1");
}

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  frontendUrl: process.env.FRONTEND_URL,
  backendUrl: process.env.BACKEND_URL,
  payment: {
    provider: process.env.PAYMENT_PROVIDER || "mock",
    publicKey: process.env.PAYMENT_PUBLIC_KEY || "",
    secretKey: process.env.PAYMENT_SECRET_KEY || "",
    webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET,
    currency: process.env.PAYMENT_CURRENCY || "PKR",
    commissionRate,
    windowMinutes: Number(process.env.PAYMENT_WINDOW_MINUTES ?? 30),
  },
};
