import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { ROLES } from "../constants/roles.js";

// DEV ONLY demo accounts
const users = [
  {
    name: "Admin User",
    email: "admin@marketplace.com",
    password: "Admin@123",
    role: ROLES.ADMIN,
  },
  {
    name: "Vendor User",
    email: "vendor@marketplace.com",
    password: "Vendor@123",
    role: ROLES.VENDOR,
  },
];

await connectDB();

for (const u of users) {
  if (await User.findOne({ email: u.email })) {
    console.log(`Skipped (exists): ${u.email}`);
    continue;
  }
  await User.create({ ...u, password: await bcrypt.hash(u.password, 12) });
  console.log(`Created ${u.role}: ${u.email}`);
}

await mongoose.connection.close();
