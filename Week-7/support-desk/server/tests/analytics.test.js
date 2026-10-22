import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { startDb, stopDb, makeUser } from "./helpers.js";
import User from "../src/models/User.js";
import Ticket from "../src/models/Ticket.js";

const H = 3600000;
let customer, agent, admin;
const get = (path, q = "") =>
  admin.http.get(`/api/admin/analytics/${path}${q}`);

beforeAll(startDb);
afterAll(stopDb);

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Ticket.deleteMany({})]);
  customer = await makeUser("CUSTOMER", "customer");
  agent = await makeUser("AGENT", "agent");
  admin = await makeUser("ADMIN", "admin");

  const base = Date.now() - 10 * H;
  const common = {
    createdBy: customer.user._id,
    description: "A long enough description",
    createdAt: new Date(base),
  };
  await Ticket.create([
    {
      ...common,
      subject: "Resolved fast",
      priority: "HIGH",
      status: "RESOLVED",
      assignedTo: agent.user._id,
      firstRespondedAt: new Date(base + 0.5 * H),
      resolvedAt: new Date(base + 2 * H),
    },
    {
      ...common,
      subject: "Answered late",
      priority: "HIGH",
      status: "IN_PROGRESS",
      assignedTo: agent.user._id,
      firstRespondedAt: new Date(base + 5 * H),
      slaFirstResponseBreached: true,
    },
    { ...common, subject: "Waiting low one", priority: "LOW", status: "OPEN" },
    {
      ...common,
      subject: "Urgent and ignored",
      priority: "URGENT",
      status: "OPEN",
    },
  ]);
});

describe("admin analytics", () => {
  it("computes the overview with aggregation", async () => {
    const { data } = (await get("overview")).body;
    expect(data).toMatchObject({
      total: 4,
      open: 2,
      unresolved: 3,
      resolved: 1,
      overdue: 1,
    });
    expect(data.avgFirstResponseMs).toBe(2.75 * H);
    expect(data.avgResolutionMs).toBe(2 * H);
  });

  it("groups tickets by status, priority and day", async () => {
    const { data } = (await get("tickets")).body;
    const count = (list, key) => list.find((x) => x.key === key).count;
    expect(count(data.byStatus, "OPEN")).toBe(2);
    expect(count(data.byStatus, "RESOLVED")).toBe(1);
    expect(count(data.byPriority, "HIGH")).toBe(2);
    expect(count(data.byPriority, "CRITICAL" in {} ? "x" : "URGENT")).toBe(1);
    expect(data.created.reduce((s, d) => s + d.count, 0)).toBe(4);
  });

  it("reports per-agent workload and performance", async () => {
    const { data } = (await get("agents")).body;
    expect(data.agents).toHaveLength(1);
    expect(data.agents[0]).toMatchObject({
      name: "agent",
      assigned: 2,
      active: 1,
      resolved: 1,
    });
    expect(data.agents[0].avgFirstResponseMs).toBe(2.75 * H);
  });

  it("calculates SLA compliance and breach rates", async () => {
    const { data } = (await get("sla")).body;
    expect(data.overall.firstResponse).toMatchObject({ met: 1, breached: 2 });
    expect(data.overall.firstResponse.complianceRate).toBe(33.3);
    expect(data.overall.resolution).toMatchObject({ met: 1, breached: 1 });
    expect(
      data.byPriority.find((p) => p.priority === "URGENT").firstResponse
        .breached,
    ).toBe(1);
  });

  it("respects the date range", async () => {
    const { data } = (await get("overview", "?from=2000-01-01&to=2000-01-02"))
      .body;
    expect(data.total).toBe(0);
  });

  it("is admin-only and validates input", async () => {
    for (const who of [customer, agent]) {
      expect((await who.http.get("/api/admin/analytics/overview")).status).toBe(
        403,
      );
    }
    expect(
      (await get("overview", "?from=2026-02-01&to=2026-01-01")).status,
    ).toBe(400);
  });
});
