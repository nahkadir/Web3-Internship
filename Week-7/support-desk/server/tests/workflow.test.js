import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "http";
import request from "supertest";
import { io as ioClient } from "socket.io-client";
import app from "../src/app.js";
import { initSocket } from "../src/realtime/socket.js";
import { startDb, stopDb, password } from "./helpers.js";
import User from "../src/models/User.js";

let server, url;
const sockets = [];

beforeAll(async () => {
  await startDb();
  server = http.createServer(app);
  initSocket(server);
  await new Promise((r) => server.listen(0, r));
  url = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  sockets.forEach((s) => s.close());
  server.close();
  await stopDb();
});

const login = async (email) => {
  const client = request.agent(app);
  const res = await client.post("/api/auth/login").send({ email, password });
  return { http: client, cookie: res.headers["set-cookie"][0].split(";")[0] };
};
const connect = (cookie) =>
  new Promise((resolve, reject) => {
    const s = ioClient(url, {
      transports: ["websocket"],
      extraHeaders: { cookie },
      reconnection: false,
    });
    sockets.push(s);
    s.on("connect", () => resolve(s));
    s.on("connect_error", reject);
  });
const join = (s, id) =>
  new Promise((resolve) => s.emit("join_ticket", id, resolve));
const once = (s, event) => new Promise((resolve) => s.once(event, resolve));
const notificationTypes = async (who) =>
  (await who.http.get("/api/notifications")).body.data.notifications.map(
    (n) => n.type,
  );

describe("complete support lifecycle", () => {
  it("customer -> admin -> agent -> real-time chat -> resolution -> analytics", async () => {
    await User.create({
      name: "Ada Admin",
      email: "admin@test.com",
      password,
      role: "ADMIN",
    });
    await User.create({
      name: "Alice Agent",
      email: "alice@test.com",
      password,
      role: "AGENT",
    });
    const alice = await User.findOne({ email: "alice@test.com" });

    // 1. a customer registers and creates a ticket
    const customer = { http: request.agent(app) };
    const reg = await customer.http
      .post("/api/auth/register")
      .send({ name: "Cathy Customer", email: "cathy@test.com", password });
    expect(reg.status).toBe(201);
    customer.cookie = reg.headers["set-cookie"][0].split(";")[0];

    const created = await customer.http
      .post("/api/tickets")
      .send({
        subject: "Cannot access my invoices",
        description: "The invoices page shows an error",
        category: "BILLING",
      });
    expect(created.status).toBe(201);
    const id = created.body.data.ticket._id;

    // 2. the admin is notified and assigns the ticket
    const admin = await login("admin@test.com");
    expect(await notificationTypes(admin)).toContain("TICKET_CREATED");
    const listed = await admin.http.get("/api/admin/tickets");
    expect(listed.body.data.tickets.map((t) => t._id)).toContain(id);
    const assigned = await admin.http
      .patch(`/api/admin/tickets/${id}/assign`)
      .send({ agentId: String(alice._id) });
    expect(assigned.status).toBe(200);

    // 3. the agent is notified and opens the ticket
    const agent = await login("alice@test.com");
    expect(await notificationTypes(agent)).toContain("TICKET_ASSIGNED");
    const opened = await agent.http.get(`/api/tickets/${id}`);
    expect(opened.status).toBe(200);
    expect(opened.body.data.ticket.createdBy.email).toBe("cathy@test.com");

    // 4. real-time messages in both directions
    const [cs, as] = await Promise.all([
      connect(customer.cookie),
      connect(agent.cookie),
    ]);
    expect((await join(cs, id)).ok).toBe(true);
    expect((await join(as, id)).ok).toBe(true);

    const toAgent = once(as, "ticket_message");
    await customer.http
      .post(`/api/tickets/${id}/messages`)
      .send({ message: "Please help me" });
    expect((await toAgent).message.message).toBe("Please help me");

    const toCustomer = once(cs, "ticket_message");
    await agent.http
      .post(`/api/tickets/${id}/messages`)
      .send({ message: "On it, one moment" });
    expect((await toCustomer).message.message).toBe("On it, one moment");

    // 5. the agent works the ticket and resolves it; the customer is notified
    expect(
      (
        await agent.http
          .patch(`/api/tickets/${id}/status`)
          .send({ status: "IN_PROGRESS" })
      ).status,
    ).toBe(200);
    expect(
      (
        await agent.http
          .patch(`/api/tickets/${id}/status`)
          .send({ status: "RESOLVED" })
      ).status,
    ).toBe(200);
    expect(await notificationTypes(customer)).toContain("TICKET_RESOLVED");

    // 6. response and resolution times show up in analytics
    const overview = (await admin.http.get("/api/admin/analytics/overview"))
      .body.data;
    expect(overview).toMatchObject({ total: 1, resolved: 1 });
    expect(overview.avgFirstResponseMs).not.toBeNull();
    expect(overview.avgResolutionMs).not.toBeNull();

    const agents = (await admin.http.get("/api/admin/analytics/agents")).body
      .data.agents;
    expect(agents[0]).toMatchObject({
      name: "Alice Agent",
      assigned: 1,
      resolved: 1,
    });

    // 7. the admin reviews the ticket history (2 replies + assignment + 2 status changes)
    const history = (await admin.http.get(`/api/tickets/${id}/messages`)).body
      .data.messages;
    expect(history.filter((m) => m.messageType === "USER")).toHaveLength(2);
    expect(history.filter((m) => m.messageType === "SYSTEM")).toHaveLength(3);

    // 8. the customer closes the ticket, and the conversation is then locked
    expect(
      (
        await customer.http
          .patch(`/api/tickets/${id}/status`)
          .send({ status: "CLOSED" })
      ).status,
    ).toBe(200);
    expect(
      (
        await customer.http
          .post(`/api/tickets/${id}/messages`)
          .send({ message: "Thanks!" })
      ).status,
    ).toBe(409);
  });

  it("sockets can also authenticate with a short-lived token", async () => {
    const user = await login("cathy@test.com");
    const { token } = (await user.http.get("/api/auth/socket-token")).body.data;
    const s = await new Promise((resolve, reject) => {
      const sock = ioClient(url, {
        transports: ["websocket"],
        auth: { token },
        reconnection: false,
      });
      sockets.push(sock);
      sock.on("connect", () => resolve(sock));
      sock.on("connect_error", reject);
    });
    expect(s.connected).toBe(true);
  });
});
