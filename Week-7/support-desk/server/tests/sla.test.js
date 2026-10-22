import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { startDb, stopDb, makeUser, baseTicket } from "./helpers.js";
import User from "../src/models/User.js";
import Ticket from "../src/models/Ticket.js";
import Notification from "../src/models/Notification.js";
import { applySlaDeadlines, computeSla } from "../src/constants/sla.js";
import { runSlaSweep } from "../src/services/sla.service.js";

const H = 3600000;
const plain = (over = {}) => ({
  priority: "HIGH",
  status: "OPEN",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  firstRespondedAt: null,
  resolvedAt: null,
  slaWarned: {},
  ...over,
});

describe("SLA calculations (pure)", () => {
  it("derives deadlines from creation time and priority", () => {
    const t = plain();
    applySlaDeadlines(t);
    expect(t.firstResponseDueAt.getTime() - t.createdAt.getTime()).toBe(4 * H);
    expect(t.resolutionDueAt.getTime() - t.createdAt.getTime()).toBe(24 * H);
  });

  it("recalculates only unmet targets when priority changes", () => {
    const answered = new Date("2026-01-01T01:00:00Z");
    const oldDue = new Date("2026-01-02T00:00:00Z");
    const t = plain({
      priority: "LOW",
      firstRespondedAt: answered,
      firstResponseDueAt: oldDue,
    });
    t.priority = "URGENT";
    applySlaDeadlines(t);
    expect(t.firstResponseDueAt).toEqual(oldDue); // already answered, unchanged
    expect(t.resolutionDueAt.getTime() - t.createdAt.getTime()).toBe(4 * H);
  });

  it("reports ON_TRACK, AT_RISK, BREACHED and MET", () => {
    const t = plain();
    applySlaDeadlines(t);
    const created = t.createdAt.getTime();

    expect(computeSla(t, new Date(created + H)).status).toBe("ON_TRACK");
    expect(
      computeSla(t, new Date(created + 4 * H - 10 * 60000)).firstResponse.state,
    ).toBe("AT_RISK");

    const late = computeSla(t, new Date(created + 5 * H));
    expect(late.status).toBe("BREACHED");
    expect(late.overdue).toBe(true);

    t.firstRespondedAt = new Date(created + H);
    t.resolvedAt = new Date(created + 2 * H);
    expect(computeSla(t, new Date(created + 5 * H)).status).toBe("MET");
  });
});

describe("SLA lifecycle", () => {
  let customer, agent, admin, id;

  beforeAll(startDb);
  afterAll(stopDb);

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Ticket.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    customer = await makeUser("CUSTOMER", "customer");
    agent = await makeUser("AGENT", "agent");
    admin = await makeUser("ADMIN", "admin");
    id = (await customer.http.post("/api/tickets").send(baseTicket)).body.data
      .ticket._id;
    await admin.http
      .patch(`/api/admin/tickets/${id}/assign`)
      .send({ agentId: String(agent.user._id) });
  });

  const get = async (who = customer) =>
    (await who.http.get(`/api/tickets/${id}`)).body.data.ticket;
  const status = (who, s) =>
    who.http.patch(`/api/tickets/${id}/status`).send({ status: s });

  it("new tickets get deadlines and an SLA summary", async () => {
    const t = await get();
    expect(t.sla.status).toBe("ON_TRACK");
    expect(t.sla.firstResponse.dueAt).toBeDefined();
    expect(t.sla.overdue).toBe(false);
  });

  it("the first staff reply records the first response; a customer reply does not", async () => {
    await customer.http
      .post(`/api/tickets/${id}/messages`)
      .send({ message: "Anyone there?" });
    expect((await get()).firstRespondedAt).toBeNull();
    await agent.http
      .post(`/api/tickets/${id}/messages`)
      .send({ message: "Looking into it" });
    const t = await get();
    expect(t.firstRespondedAt).not.toBeNull();
    expect(t.sla.firstResponse.state).toBe("MET");
  });

  it("changing priority recalculates the deadlines from creation time", async () => {
    await agent.http.patch(`/api/tickets/${id}`).send({ priority: "URGENT" });
    const t = await get();
    const gap = new Date(t.sla.firstResponse.dueAt) - new Date(t.createdAt);
    expect(gap).toBe(1 * H);
  });

  it("resolving records resolution and reopening clears it", async () => {
    await status(agent, "IN_PROGRESS");
    await status(agent, "RESOLVED");
    let t = await get();
    expect(t.resolvedAt).not.toBeNull();
    expect(t.sla.resolution.state).toBe("MET");
    await status(customer, "OPEN");
    t = await get();
    expect(t.resolvedAt).toBeNull();
    expect(t.sla.resolution.state).toBe("ON_TRACK");
  });

  it("the sweep flags overdue tickets and notifies each person once", async () => {
    await Ticket.updateOne(
      { _id: id },
      { $set: { firstResponseDueAt: new Date(Date.now() - 1000) } },
    );

    const first = await runSlaSweep();
    expect(first.breaches).toBeGreaterThanOrEqual(1);
    await runSlaSweep(); // running it again must not duplicate anything

    const forAgent = await Notification.countDocuments({
      userId: agent.user._id,
      type: "SLA_BREACHED",
    });
    const forAdmin = await Notification.countDocuments({
      userId: admin.user._id,
      type: "SLA_BREACHED",
    });
    expect(forAgent).toBe(1);
    expect(forAdmin).toBe(1);
    expect((await get()).sla.overdue).toBe(true);
  });

  it("overdue tickets can be filtered", async () => {
    await Ticket.updateOne(
      { _id: id },
      { $set: { firstResponseDueAt: new Date(Date.now() - 1000) } },
    );
    const res = await admin.http.get("/api/admin/tickets?overdue=true");
    expect(res.body.data.pagination.total).toBe(1);
  });
});
