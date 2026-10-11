import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach } from "vitest";

Object.assign(process.env, {
  NODE_ENV: "test",
  JWT_SECRET: "test-jwt-secret-that-is-long-enough-1234567890",
  FRONTEND_URL: "http://localhost:5173",
  BACKEND_URL: "http://127.0.0.1:9", // nothing listens here, so mock webhook delivery fails fast
  PAYMENT_PROVIDER: "mock",
  PAYMENT_PUBLIC_KEY: "pk_test",
  PAYMENT_SECRET_KEY: "sk_test",
  PAYMENT_WEBHOOK_SECRET: "whsec_test_secret",
  PAYMENT_CURRENCY: "PKR",
  COMMISSION_RATE: "0.10",
  PAYMENT_WINDOW_MINUTES: "30",
});

const mongod = await MongoMemoryServer.create();
process.env.DATABASE_URL = mongod.getUri("marketplace_test");
await mongoose.connect(process.env.DATABASE_URL);

beforeAll(async () => {
  await Promise.all(Object.values(mongoose.models).map((m) => m.init())); // build unique/partial indexes
});

beforeEach(async () => {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})),
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
