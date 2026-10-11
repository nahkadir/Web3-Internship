import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app.js";
import { PASSWORD, makeActor, makeUser } from "./helpers.js";

const register = (body) => request(app).post("/api/auth/register").send(body);

describe("authentication", () => {
  it("registers a customer, normalises the email and never returns the password", async () => {
    const res = await register({
      name: "Test User",
      email: "New@Test.com",
      password: PASSWORD,
    }).expect(201);
    expect(res.body.user.role).toBe("CUSTOMER");
    expect(res.body.user.email).toBe("new@test.com");
    expect(res.body.user.password).toBeUndefined();
  });

  it("ignores a role sent by the client", async () => {
    const res = await register({
      name: "Sneaky",
      email: "s@test.com",
      password: PASSWORD,
      role: "ADMIN",
    }).expect(201);
    expect(res.body.user.role).toBe("CUSTOMER");
  });

  it("rejects duplicate emails, weak passwords and missing fields", async () => {
    await register({
      name: "A User",
      email: "dup@test.com",
      password: PASSWORD,
    }).expect(201);
    await register({
      name: "A User",
      email: "dup@test.com",
      password: PASSWORD,
    }).expect(409);
    const weak = await register({
      name: "A User",
      email: "w@test.com",
      password: "short",
    }).expect(400);
    expect(weak.body.errors.length).toBeGreaterThan(0);
    await register({ email: "x@test.com" }).expect(400);
  });

  it("logs in and gives one generic message for bad credentials", async () => {
    const user = await makeUser();
    const ok = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: PASSWORD })
      .expect(200);
    expect(ok.body.user.password).toBeUndefined();

    const wrong = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "Wrong1234" })
      .expect(401);
    const unknown = await request(app)
      .post("/api/auth/login")
      .send({ email: "no@test.com", password: PASSWORD })
      .expect(401);
    expect(wrong.body.message).toBe(unknown.body.message);
  });

  it("protects /me and logout ends the session", async () => {
    await request(app).get("/api/auth/me").expect(401);
    const { agent } = await makeActor();
    await agent.get("/api/auth/me").expect(200);
    await agent.post("/api/auth/logout").expect(200);
    await agent.get("/api/auth/me").expect(401);
  });
});

describe("role-based access control", () => {
  it("returns 401 to anonymous users", async () => {
    for (const path of [
      "/api/cart",
      "/api/orders",
      "/api/vendor/orders",
      "/api/admin/orders",
    ]) {
      await request(app).get(path).expect(401);
    }
  });

  it("returns 403 when the role is wrong", async () => {
    const customer = await makeActor("CUSTOMER");
    for (const p of [
      "/api/vendor/dashboard",
      "/api/admin/dashboard",
      "/api/vendor/orders",
      "/api/admin/orders",
      "/api/admin/payments",
      "/api/admin/stats",
    ]) {
      await customer.agent.get(p).expect(403);
    }
    const vendor = await makeActor("VENDOR");
    for (const p of [
      "/api/admin/stats",
      "/api/customer/dashboard",
      "/api/admin/vendors",
    ]) {
      await vendor.agent.get(p).expect(403);
    }
    const admin = await makeActor("ADMIN");
    for (const p of ["/api/vendor/dashboard", "/api/vendor/earnings"]) {
      await admin.agent.get(p).expect(403);
    }
  });

  it("lets each role into its own area", async () => {
    for (const [role, path] of [
      ["CUSTOMER", "/api/customer/dashboard"],
      ["VENDOR", "/api/vendor/dashboard"],
      ["ADMIN", "/api/admin/dashboard"],
    ]) {
      const { agent } = await makeActor(role);
      await agent.get(path).expect(200);
    }
  });
});

describe("validation and error handling", () => {
  it("rejects invalid ids with 400 and unknown routes with 404", async () => {
    await request(app).get("/api/products/not-an-id").expect(400);
    const res = await request(app).get("/api/nothing-here").expect(404);
    expect(res.body.success).toBe(false);
  });

  it("handles malformed JSON without leaking internals", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email":')
      .expect(400);
    expect(res.body.message).toMatch(/malformed/i);
    expect(res.body.stack).toBeUndefined();
  });
});
