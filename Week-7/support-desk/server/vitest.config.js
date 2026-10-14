import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      JWT_SECRET: "test_secret",
      MONGO_URI: "mongodb://127.0.0.1:27017/unused",
    },
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
