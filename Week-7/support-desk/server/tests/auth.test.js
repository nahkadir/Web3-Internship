import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app.js";
import User from "../src/models/User.js";

let mongo;
const validUser = {
  name: "Rida",
  email: "rida@test.com",
  password: "Password1",
};

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe("POST /api/auth/register", () => {
  it("registers a CUSTOMER, sets cookie, hides password", async () => {
    const res = await request(app).post("/api/auth/register").send(validUser);
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe("CUSTOMER");
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.headers["set-cookie"][0]).toMatch(/token=.*HttpOnly/);
  });

  it("ignores a role sent in the body", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validUser, role: "ADMIN" });
    expect(res.body.data.user.role).toBe("CUSTOMER");
  });

  it("rejects duplicate email with 409", async () => {
    await request(app).post("/api/auth/register").send(validUser);
    const res = await request(app).post("/api/auth/register").send(validUser);
    expect(res.status).toBe(409);
  });

  it("rejects invalid input with 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "R", email: "bad", password: "123" });
    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send(validUser);
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: validUser.password });
    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects wrong password with 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: "Wrong123" });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/me and logout", () => {
  it("returns 401 without a cookie", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the user when logged in, and 401 after logout", async () => {
    const agent = request.agent(app); // keeps cookies between requests
    await agent.post("/api/auth/register").send(validUser);

    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe(validUser.email);

    await agent.post("/api/auth/logout");
    const after = await agent.get("/api/auth/me");
    expect(after.status).toBe(401);
  });
});
