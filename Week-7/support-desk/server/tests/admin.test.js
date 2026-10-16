import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app.js";
import User from "../src/models/User.js";

let mongo;
const password = "Password1";

const loginAs = async (role) => {
  const user = await User.create({
    name: role,
    email: `${role.toLowerCase()}@test.com`,
    password,
    role,
  });
  const agent = request.agent(app);
  await agent.post("/api/auth/login").send({ email: user.email, password });
  return { agent, user };
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

describe("GET /api/admin/users", () => {
  it("401 when not logged in", async () => {
    const res = await request(app).get("/api/admin/users");
    expect(res.status).toBe(401);
  });

  it("403 for CUSTOMER and AGENT", async () => {
    for (const role of ["CUSTOMER", "AGENT"]) {
      const { agent } = await loginAs(role);
      const res = await agent.get("/api/admin/users");
      expect(res.status).toBe(403);
    }
  });

  it("200 for ADMIN with users and pagination, no passwords", async () => {
    const { agent } = await loginAs("ADMIN");
    await User.create({ name: "Other", email: "other@test.com", password });
    const res = await agent.get("/api/admin/users");
    expect(res.status).toBe(200);
    expect(res.body.data.users).toHaveLength(2);
    expect(res.body.data.pagination.total).toBe(2);
    expect(res.body.data.users[0].password).toBeUndefined();
  });
});

describe("PATCH /api/admin/users/:id/role", () => {
  it("403 when a CUSTOMER tries to change a role", async () => {
    const { agent, user } = await loginAs("CUSTOMER");
    const res = await agent
      .patch(`/api/admin/users/${user._id}/role`)
      .send({ role: "ADMIN" });
    expect(res.status).toBe(403);
    expect((await User.findById(user._id)).role).toBe("CUSTOMER");
  });

  it("ADMIN can promote a user to AGENT", async () => {
    const { agent } = await loginAs("ADMIN");
    const target = await User.create({
      name: "Target",
      email: "t@test.com",
      password,
    });
    const res = await agent
      .patch(`/api/admin/users/${target._id}/role`)
      .send({ role: "AGENT" });
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe("AGENT");
  });

  it("rejects an invalid role with 400", async () => {
    const { agent } = await loginAs("ADMIN");
    const target = await User.create({
      name: "Target",
      email: "t@test.com",
      password,
    });
    const res = await agent
      .patch(`/api/admin/users/${target._id}/role`)
      .send({ role: "SUPERUSER" });
    expect(res.status).toBe(400);
  });

  it("rejects an invalid id with 400 and an unknown id with 404", async () => {
    const { agent } = await loginAs("ADMIN");
    const bad = await agent
      .patch("/api/admin/users/123/role")
      .send({ role: "AGENT" });
    expect(bad.status).toBe(400);
    const missing = await agent
      .patch(`/api/admin/users/${new mongoose.Types.ObjectId()}/role`)
      .send({ role: "AGENT" });
    expect(missing.status).toBe(404);
  });

  it("ADMIN cannot change their own role", async () => {
    const { agent, user } = await loginAs("ADMIN");
    const res = await agent
      .patch(`/api/admin/users/${user._id}/role`)
      .send({ role: "CUSTOMER" });
    expect(res.status).toBe(400);
  });
});
