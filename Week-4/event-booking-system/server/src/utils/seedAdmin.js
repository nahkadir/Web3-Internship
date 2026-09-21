import mongoose from "mongoose";
import { env } from "../config/env.js";
import User from "../models/User.js";

const run = async () => {
  await mongoose.connect(env.mongoUri);

  const email = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
  const existing = await User.findOne({ email });

  if (existing) {
    existing.role = "ADMIN";
    await existing.save();
    console.log(`Existing user promoted to ADMIN: ${email}`);
  } else {
    await User.create({
      name: process.env.ADMIN_NAME || "Admin",
      email,
      password: process.env.ADMIN_PASSWORD || "admin12345",
      role: "ADMIN",
    });
    console.log(`Admin created: ${email}`);
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
