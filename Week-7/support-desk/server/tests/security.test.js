import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { startDb, stopDb, makeUser, baseTicket } from "./helpers.js";

const oid = "64b7f0f0f0f0f0f0f0f0f0f0";

beforeAll(startDb);
afterAll(stopDb);

describe("authentication is required on every protected route", () => {
  const routes = [
    ["get", "/api/auth/me"],
    ["get", "/api/auth/socket-token"],
    ["get", "/api/tickets"],
    ["post", "/api/tickets"],
    ["get", `/api/tickets/${oid}`],
    ["patch", `/api/tickets/${oid}`],
    ["patch", `/api/tickets/${oid}/status`],
    ["get", `/api/tickets/${oid}/messages`],
    ["post", `/api/tickets/${oid}/messages`],
    ["patch", `/api/tickets/${oid}/messages/${oid}`],
    ["get", "/api/notifications"],
    ["patch", "/api/notifications/read-all"],
    ["get", "/api/admin/users"],
    ["get", "/api/admin/tickets"],
    ["patch", `/api/admin/tickets/${oid}/assign`],
    ["get", "/api/admin/analytics/overview"],
    ["get", "/api/admin/analytics/sla"],
  ];

  it.each(routes)("%s %s returns 401 without a login", async (method, path) => {
    const res = await request(app)[method](path);
    expect(res.status).toBe(401);
  });
});

describe("input hardening", () => {
  it("rejects NoSQL operator injection in login", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: { $gt: "" }, password: { $gt: "" } });
    expect(res.status).toBe(400);
  });

  it("rejects malformed JSON with a generic message", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send("{bad json");
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid JSON body");
  });

  it("rejects oversized request bodies", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "x".repeat(30000) });
    expect(res.status).toBe(413);
  });

  it("never exposes stack traces or internals in error responses", async () => {
    for (const res of [
      await request(app).get("/api/nope"),
      await request(app).post("/api/auth/login").send({}),
    ]) {
      expect(res.body.stack).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toMatch(/node_modules|at .*\.js/);
    }
  });
});

describe("abuse protection and privilege rules", () => {
  it("caps pagination so lists cannot be abused", async () => {
    const customer = await makeUser("CUSTOMER", "customer");
    expect((await customer.http.get("/api/tickets?limit=100000")).status).toBe(
      400,
    );
    expect((await customer.http.get("/api/tickets?page=999999")).status).toBe(
      400,
    );
    expect(
      (await customer.http.get("/api/notifications?limit=500")).status,
    ).toBe(400);
  });

  it("a customer cannot reassign or take over a ticket through PATCH", async () => {
    const customer = await makeUser("CUSTOMER", "owner");
    const agent = await makeUser("AGENT", "someagent");
    const id = (await customer.http.post("/api/tickets").send(baseTicket)).body
      .data.ticket._id;
    const res = await customer.http
      .patch(`/api/tickets/${id}`)
      .send({ assignedTo: String(agent.user._id), createdBy: oid });
    expect(res.status).toBe(400); // unknown fields are stripped, leaving nothing to update
    const after = await customer.http.get(`/api/tickets/${id}`);
    expect(after.body.data.ticket.assignedTo).toBeNull();
  });

  it("a socket token is not accepted as a login cookie", async () => {
    const user = await makeUser("CUSTOMER", "tokentest");
    const { token } = (await user.http.get("/api/auth/socket-token")).body.data;
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `token=${token}`);
    expect(res.status).toBe(401);
  });
});
