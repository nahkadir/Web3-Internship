// test helper functions that create the data needed for API tests
// so you don't have to repeat registration, login, and event creation in every test.

import request from "supertest";
import app from "../../src/app.js";

export const registerAndLogin = async (overrides = {}) => {
  const email =
    overrides.email || `user_${Date.now()}_${Math.random()}@test.com`;
  await request(app)
    .post("/api/auth/register")
    .send({ name: "Test User", email, password: "password123", ...overrides });

  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "password123" });

  return { token: res.body.data.token, user: res.body.data.user };
};

export const makeAdmin = async () => {
  const { token, user } = await registerAndLogin();
  const User = (await import("../../src/models/User.js")).default;
  await User.findByIdAndUpdate(user._id, { role: "ADMIN" });

  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: user.email, password: "password123" });

  return { token: res.body.data.token, user };
};

export const createEvent = async (adminToken, overrides = {}) => {
  const res = await request(app)
    .post("/api/events")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      title: "Test Event",
      description: "A test event",
      location: "Test Location",
      startDate: "2026-12-10T09:00:00.000Z",
      endDate: "2026-12-10T17:00:00.000Z",
      totalSeats: 10,
      price: 1000,
      ...overrides,
    });

  return res.body.data.event;
};
