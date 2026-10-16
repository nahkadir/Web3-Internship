import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "vitest";
import http from "http";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { io as ioClient } from "socket.io-client";
import app from "../src/app.js";
import { initSocket } from "../src/realtime/socket.js";
import User from "../src/models/User.js";
import Ticket from "../src/models/Ticket.js";
import TicketMessage from "../src/models/TicketMessage.js";

let mongo, server, url, customer, other, agent, agent2, admin, ticketId;
const sockets = [];
const password = "Password1";
const base = {
  subject: "Cannot log in",
  description: "I cannot log in to my account",
};

const makeUser = async (role, name) => {
  const user = await User.create({
    name,
    email: `${name}@test.com`,
    password,
    role,
  });
  const client = request.agent(app);
  const res = await client
    .post("/api/auth/login")
    .send({ email: user.email, password });
  return {
    http: client,
    user,
    cookie: res.headers["set-cookie"][0].split(";")[0],
  };
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
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const post = (who, text, id = ticketId) =>
  who.http.post(`/api/tickets/${id}/messages`).send({ message: text });
const assign = (id, a) =>
  admin.http
    .patch(`/api/admin/tickets/${id}/assign`)
    .send({ agentId: String(a.user._id) });
const setStatus = (who, status) =>
  who.http.patch(`/api/tickets/${ticketId}/status`).send({ status });

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  server = http.createServer(app);
  initSocket(server);
  await new Promise((r) => server.listen(0, r));
  url = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  server.close();
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Ticket.deleteMany({}),
    TicketMessage.deleteMany({}),
  ]);
  customer = await makeUser("CUSTOMER", "customer");
  other = await makeUser("CUSTOMER", "other");
  agent = await makeUser("AGENT", "agent");
  agent2 = await makeUser("AGENT", "agent2");
  admin = await makeUser("ADMIN", "admin");
  const res = await customer.http.post("/api/tickets").send(base);
  ticketId = res.body.data.ticket._id;
});

afterEach(() => {
  sockets.splice(0).forEach((s) => s.close());
});

describe("message API", () => {
  it("customer posts a USER message and it is stored with the sender", async () => {
    const res = await post(customer, "Hello, I need help");
    expect(res.status).toBe(201);
    expect(res.body.data.message).toMatchObject({
      messageType: "USER",
      message: "Hello, I need help",
    });
    expect(res.body.data.message.senderId.name).toBe("customer");
  });

  it("rejects empty messages with 400", async () => {
    expect((await post(customer, "   ")).status).toBe(400);
  });

  it("hides the conversation from other customers and unassigned agents", async () => {
    await post(customer, "Private");
    for (const who of [other, agent]) {
      expect((await post(who, "Hi")).status).toBe(404);
      expect(
        (await who.http.get(`/api/tickets/${ticketId}/messages`)).status,
      ).toBe(404);
    }
  });

  it("agent replies after assignment; history is ordered and includes the system message", async () => {
    await post(customer, "first");
    await assign(ticketId, agent);
    await post(agent, "second");
    const res = await customer.http.get(`/api/tickets/${ticketId}/messages`);
    expect(res.body.data.messages.map((m) => m.messageType)).toEqual([
      "USER",
      "SYSTEM",
      "USER",
    ]);
    expect(res.body.data.messages[2].message).toBe("second");
  });

  it("paginates with limit and before", async () => {
    for (const t of ["a", "b", "c"]) await post(customer, t);
    const page1 = await customer.http.get(
      `/api/tickets/${ticketId}/messages?limit=2`,
    );
    expect(page1.body.data.messages.map((m) => m.message)).toEqual(["b", "c"]);
    expect(page1.body.data.hasMore).toBe(true);
    const before = page1.body.data.messages[0]._id;
    const page2 = await customer.http.get(
      `/api/tickets/${ticketId}/messages?limit=2&before=${before}`,
    );
    expect(page2.body.data.messages.map((m) => m.message)).toEqual(["a"]);
    expect(page2.body.data.hasMore).toBe(false);
  });

  it("blocks messages on closed tickets with 409", async () => {
    await setStatus(admin, "CLOSED");
    expect((await post(customer, "too late")).status).toBe(409);
  });

  it("a customer reply moves WAITING_FOR_CUSTOMER back to IN_PROGRESS", async () => {
    await assign(ticketId, agent);
    await setStatus(agent, "IN_PROGRESS");
    await setStatus(agent, "WAITING_FOR_CUSTOMER");
    await post(customer, "Here is the info");
    const res = await customer.http.get(`/api/tickets/${ticketId}`);
    expect(res.body.data.ticket.status).toBe("IN_PROGRESS");
  });
});

describe("editing messages", () => {
  const edit = (who, id, text) =>
    who.http
      .patch(`/api/tickets/${ticketId}/messages/${id}`)
      .send({ message: text });

  it("sender can edit within the window", async () => {
    const id = (await post(customer, "typo")).body.data.message._id;
    const res = await edit(customer, id, "fixed");
    expect(res.status).toBe(200);
    expect(res.body.data.message.message).toBe("fixed");
    expect(res.body.data.message.editedAt).not.toBeNull();
  });

  it("nobody else can edit it, not even an admin or the assigned agent", async () => {
    await assign(ticketId, agent);
    const id = (await post(customer, "mine")).body.data.message._id;
    expect((await edit(agent, id, "hacked")).status).toBe(403);
    expect((await edit(admin, id, "hacked")).status).toBe(403);
    expect((await edit(other, id, "hacked")).status).toBe(404);
  });

  it("rejects edits after the time limit", async () => {
    const id = (await post(customer, "old")).body.data.message._id;
    await TicketMessage.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { createdAt: new Date(Date.now() - 20 * 60 * 1000) } },
    );
    expect((await edit(customer, id, "late")).status).toBe(403);
  });

  it("system messages cannot be edited", async () => {
    await assign(ticketId, agent);
    const system = await TicketMessage.findOne({ messageType: "SYSTEM" });
    expect((await edit(admin, system._id, "x")).status).toBe(403);
  });
});

describe("sockets", () => {
  it("rejects connections without a valid cookie", async () => {
    await expect(connect("token=nonsense")).rejects.toThrow(
      "Not authenticated",
    );
    await expect(connect("")).rejects.toThrow("Not authenticated");
  });

  it("only authorized users can join a ticket room", async () => {
    const [cs, os, as] = await Promise.all([
      connect(customer.cookie),
      connect(other.cookie),
      connect(agent.cookie),
    ]);
    expect((await join(cs, ticketId)).ok).toBe(true);
    expect((await join(os, ticketId)).ok).toBe(false);
    expect((await join(as, ticketId)).ok).toBe(false); // not assigned yet
    await assign(ticketId, agent);
    expect((await join(as, ticketId)).ok).toBe(true);
    expect((await join(as, "not-an-id")).ok).toBe(false);
  });

  it("broadcasts a saved message to participants only", async () => {
    await assign(ticketId, agent);
    const [cs, as, os] = await Promise.all([
      connect(customer.cookie),
      connect(agent.cookie),
      connect(other.cookie),
    ]);
    await join(cs, ticketId);
    await join(as, ticketId);
    await join(os, ticketId); // denied

    let leaked = false;
    os.on("ticket_message", () => {
      leaked = true;
    });

    const incoming = once(as, "ticket_message");
    const res = await post(customer, "live message");
    const { message } = await incoming;

    expect(message._id).toBe(res.body.data.message._id); // same id as the API response, so clients can dedupe
    expect(await TicketMessage.findById(message._id)).not.toBeNull(); // persisted
    await wait(200);
    expect(leaked).toBe(false);
  });

  it("announces joins and sends status changes to the room", async () => {
    await assign(ticketId, agent);
    const [cs, as] = await Promise.all([
      connect(customer.cookie),
      connect(agent.cookie),
    ]);
    await join(cs, ticketId);
    const joined = once(cs, "user_joined");
    await join(as, ticketId);
    expect((await joined).user.name).toBe("agent");

    const changed = once(cs, "ticket_status_changed");
    await setStatus(agent, "IN_PROGRESS");
    expect((await changed).status).toBe("IN_PROGRESS");
  });

  it("reassigning removes the previous agent from the room", async () => {
    await assign(ticketId, agent);
    const [cs, as] = await Promise.all([
      connect(customer.cookie),
      connect(agent.cookie),
    ]);
    await join(cs, ticketId);
    await join(as, ticketId);

    const notified = once(as, "ticket_assigned"); // old agent is still told about the change
    await assign(ticketId, agent2);
    await notified;

    let leaked = false;
    as.on("ticket_message", () => {
      leaked = true;
    });
    await post(customer, "after reassignment");
    await wait(200);
    expect(leaked).toBe(false);
  });
});
