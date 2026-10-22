import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { startDb, stopDb, makeUser, baseTicket } from "./helpers.js";
import User from "../src/models/User.js";
import Ticket from "../src/models/Ticket.js";
import Notification from "../src/models/Notification.js";

let customer, other, agent, admin, id;

const types = async (user) =>
  (await Notification.find({ userId: user.user._id }))
    .map((n) => n.type)
    .sort();
const status = (who, s) =>
  who.http.patch(`/api/tickets/${id}/status`).send({ status: s });
const assign = () =>
  admin.http
    .patch(`/api/admin/tickets/${id}/assign`)
    .send({ agentId: String(agent.user._id) });

beforeAll(startDb);
afterAll(stopDb);

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Ticket.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  customer = await makeUser("CUSTOMER", "customer");
  other = await makeUser("CUSTOMER", "other");
  agent = await makeUser("AGENT", "agent");
  admin = await makeUser("ADMIN", "admin");
  id = (await customer.http.post("/api/tickets").send(baseTicket)).body.data
    .ticket._id;
});

describe("notification generation", () => {
  it("ticket creation notifies admins only", async () => {
    expect(await types(admin)).toEqual(["TICKET_CREATED"]);
    expect(await types(customer)).toEqual([]);
  });

  it("assignment notifies the agent and the customer", async () => {
    await assign();
    expect(await types(agent)).toEqual(["TICKET_ASSIGNED"]);
    expect(await types(customer)).toEqual(["TICKET_ASSIGNED"]);
  });

  it("replies notify the other party but not the sender", async () => {
    await assign();
    await Notification.deleteMany({});
    await customer.http
      .post(`/api/tickets/${id}/messages`)
      .send({ message: "Hello agent" });
    expect(await types(agent)).toEqual(["NEW_REPLY"]);
    expect(await types(customer)).toEqual([]);
    await agent.http
      .post(`/api/tickets/${id}/messages`)
      .send({ message: "Hello customer" });
    expect(await types(customer)).toEqual(["NEW_REPLY"]);
  });

  it("status changes and resolution notify the customer", async () => {
    await assign();
    await Notification.deleteMany({});
    await status(agent, "IN_PROGRESS");
    expect(await types(customer)).toEqual(["STATUS_CHANGED"]);
    await status(agent, "RESOLVED");
    expect(await types(customer)).toEqual([
      "STATUS_CHANGED",
      "TICKET_RESOLVED",
    ]);
    expect(await types(agent)).toEqual([]);
  });
});

describe("notification API", () => {
  it("lists only my notifications with an unread count", async () => {
    const res = await admin.http.get("/api/notifications");
    expect(res.status).toBe(200);
    expect(res.body.data.unreadCount).toBe(1);
    const mine = await customer.http.get("/api/notifications");
    expect(mine.body.data.notifications).toHaveLength(0);
  });

  it("marks one notification as read", async () => {
    const list = await admin.http.get("/api/notifications");
    const nid = list.body.data.notifications[0]._id;
    const res = await admin.http.patch(`/api/notifications/${nid}/read`);
    expect(res.body.data.notification.isRead).toBe(true);
    expect(
      (await admin.http.get("/api/notifications")).body.data.unreadCount,
    ).toBe(0);
  });

  it("cannot mark someone else's notification", async () => {
    const nid = (await admin.http.get("/api/notifications")).body.data
      .notifications[0]._id;
    expect(
      (await customer.http.patch(`/api/notifications/${nid}/read`)).status,
    ).toBe(404);
    expect((await Notification.findById(nid)).isRead).toBe(false);
  });

  it("marks everything as read and requires login", async () => {
    await assign();
    const res = await agent.http.patch("/api/notifications/read-all");
    expect(res.status).toBe(200);
    expect(
      (await agent.http.get("/api/notifications")).body.data.unreadCount,
    ).toBe(0);
    const anon = await other.http.get("/api/notifications?limit=500");
    expect(anon.status).toBe(400); // limit above the maximum is rejected
  });
});
