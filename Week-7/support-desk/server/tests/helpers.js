import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app.js";
import User from "../src/models/User.js";

export const password = "Password1";
export const baseTicket = {
  subject: "Cannot log in",
  description: "I cannot log in to my account",
};

let mongo;
export const startDb = async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
};
export const stopDb = async () => {
  await mongoose.disconnect();
  await mongo.stop();
};

export const makeUser = async (role, name) => {
  const user = await User.create({
    name,
    email: `${name}@test.com`,
    password,
    role,
  });
  const http = request.agent(app);
  await http.post("/api/auth/login").send({ email: user.email, password });
  return { http, user };
};
