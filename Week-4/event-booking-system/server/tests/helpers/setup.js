// manages test database lifecycle so the API tests can run with a clean database

import mongoose from "mongoose";
import { env } from "../../src/config/env.js";

export const connectTestDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(env.testMongoUri || env.mongoUri);
  }
};

export const disconnectTestDB = async () => {
  await mongoose.connection.close();
};

export const clearCollections = async () => {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
};
