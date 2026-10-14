import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app.js";
import User from "../src/models/User.js";
import Ticket from "../src/models/Ticket.js";

let mongo, customer, other, agent, admin;
const password = "Password1";
const base = {
  subject: "Cannot log in",
  description: "I cannot log in to my account",
  category: "ACCOUNT",
};

const makeUser = async (role, name) => {
  const user = await User.create({
    name,
    email: `${name}@test.com`,
    password,
    role,
  });
  const http = request.agent(app);
  await http.post("/api/auth/login").send({ email: user.email, password });
  return { http, user };
};

const create = (who, body = {}) =>
  who.http.post("/api/tickets").send({ ...base, ...body });
const assign = (id, agentId) =>
  admin.http
    .patch(`/api/admin/tickets/${id}/assign`)
    .send({ agentId: String(agentId) });
const setStatus = (who, id, status) =>
  who.http.patch(`/api/tickets/${id}/status`).send({ status });
const idOf = (res) => res.body.data.ticket._id;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Ticket.deleteMany({})]);
  customer = await makeUser("CUSTOMER", "customer");
  other = await makeUser("CUSTOMER", "other");
  agent = await makeUser("AGENT", "agent");
  admin = await makeUser("ADMIN", "admin");
});

describe("creating tickets", () => {
  it("customer creates an OPEN ticket with a ticket number", async () => {
    const res = await create(customer);
    expect(res.status).toBe(201);
    const t = res.body.data.ticket;
    expect(t.ticketNumber).toMatch(/^TKT-\d{6}$/);
    expect(t.status).toBe("OPEN");
    expect(t.priority).toBe("MEDIUM");
    expect(t.assignedTo).toBeNull();
  });

  it("ignores status and priority sent by the customer", async () => {
    const res = await create(customer, {
      status: "RESOLVED",
      priority: "URGENT",
    });
    expect(res.body.data.ticket.status).toBe("OPEN");
    expect(res.body.data.ticket.priority).toBe("MEDIUM");
  });

  it("agents and admins cannot create tickets", async () => {
    expect((await create(agent)).status).toBe(403);
    expect((await create(admin)).status).toBe(403);
  });

  it("rejects invalid input with 400", async () => {
    const res = await create(customer, { subject: "hi" });
    expect(res.status).toBe(400);
  });
});

describe("visibility", () => {
  it("customers only list their own tickets", async () => {
    await create(customer);
    await create(other);
    const res = await customer.http.get("/api/tickets");
    expect(res.body.data.pagination.total).toBe(1);
  });

  it("returns 404 for another customer's ticket", async () => {
    const id = idOf(await create(other));
    expect((await customer.http.get(`/api/tickets/${id}`)).status).toBe(404);
  });

  it("agents only see assigned tickets; customers do not see agent emails", async () => {
    const t1 = idOf(await create(customer));
    const t2 = idOf(await create(customer));
    await assign(t1, agent.user._id);

    const list = await agent.http.get("/api/tickets");
    expect(list.body.data.pagination.total).toBe(1);
    expect((await agent.http.get(`/api/tickets/${t2}`)).status).toBe(404);

    const asAgent = await agent.http.get(`/api/tickets/${t1}`);
    expect(asAgent.body.data.ticket.createdBy.email).toBe("customer@test.com");

    const asCustomer = await customer.http.get(`/api/tickets/${t1}`);
    expect(asCustomer.body.data.ticket.assignedTo.name).toBe("agent");
    expect(asCustomer.body.data.ticket.assignedTo.email).toBeUndefined();
  });
});

describe("assignment", () => {
  it("admin assigns and reassigns an agent", async () => {
    const second = await makeUser("AGENT", "agent2");
    const id = idOf(await create(customer));
    expect(
      (await assign(id, agent.user._id)).body.data.ticket.assignedTo.name,
    ).toBe("agent");
    expect(
      (await assign(id, second.user._id)).body.data.ticket.assignedTo.name,
    ).toBe("agent2");
  });

  it("rejects assigning to a non-agent with 400", async () => {
    const id = idOf(await create(customer));
    expect((await assign(id, other.user._id)).status).toBe(400);
  });

  it("customers and agents cannot assign", async () => {
    const id = idOf(await create(customer));
    for (const who of [customer, agent]) {
      const res = await who.http
        .patch(`/api/admin/tickets/${id}/assign`)
        .send({ agentId: String(agent.user._id) });
      expect(res.status).toBe(403);
    }
  });

  it("cannot assign a closed ticket", async () => {
    const id = idOf(await create(customer));
    await setStatus(admin, id, "CLOSED");
    expect((await assign(id, agent.user._id)).status).toBe(409);
  });
});

describe("status transitions", () => {
  it("agent works a ticket through to RESOLVED and resolvedAt is set", async () => {
    const id = idOf(await create(customer));
    await assign(id, agent.user._id);
    expect((await setStatus(agent, id, "IN_PROGRESS")).status).toBe(200);
    const res = await setStatus(agent, id, "RESOLVED");
    expect(res.status).toBe(200);
    expect(res.body.data.ticket.resolvedAt).not.toBeNull();
  });

  it("reopening clears resolvedAt", async () => {
    const id = idOf(await create(customer));
    await assign(id, agent.user._id);
    await setStatus(agent, id, "IN_PROGRESS");
    await setStatus(agent, id, "RESOLVED");
    const res = await setStatus(agent, id, "IN_PROGRESS");
    expect(res.body.data.ticket.resolvedAt).toBeNull();
  });

  it("skipping a step is a 400", async () => {
    const id = idOf(await create(customer));
    await assign(id, agent.user._id);
    expect((await setStatus(agent, id, "RESOLVED")).status).toBe(400);
  });

  it("an unassigned agent cannot touch the ticket", async () => {
    const id = idOf(await create(customer));
    expect((await setStatus(agent, id, "IN_PROGRESS")).status).toBe(404);
  });

  it("customer can cancel an OPEN ticket, but cannot close it directly", async () => {
    const a = idOf(await create(customer));
    const b = idOf(await create(customer));
    expect((await setStatus(customer, b, "CLOSED")).status).toBe(403);
    expect((await setStatus(customer, a, "CANCELLED")).status).toBe(200);
    expect((await setStatus(customer, a, "OPEN")).status).toBe(400); // final state
  });

  it("customer can close a RESOLVED ticket", async () => {
    const id = idOf(await create(customer));
    await assign(id, agent.user._id);
    await setStatus(agent, id, "IN_PROGRESS");
    await setStatus(agent, id, "RESOLVED");
    expect((await setStatus(customer, id, "CLOSED")).status).toBe(200);
  });
});

describe("editing tickets", () => {
  it("customer edits while OPEN but not priority", async () => {
    const id = idOf(await create(customer));
    const ok = await customer.http
      .patch(`/api/tickets/${id}`)
      .send({ subject: "Updated subject" });
    expect(ok.status).toBe(200);
    expect(ok.body.data.ticket.subject).toBe("Updated subject");
    const bad = await customer.http
      .patch(`/api/tickets/${id}`)
      .send({ priority: "URGENT" });
    expect(bad.status).toBe(403);
  });

  it("customer cannot edit once work has started", async () => {
    const id = idOf(await create(customer));
    await assign(id, agent.user._id);
    await setStatus(agent, id, "IN_PROGRESS");
    const res = await customer.http
      .patch(`/api/tickets/${id}`)
      .send({ subject: "Too late now" });
    expect(res.status).toBe(409);
  });

  it("agent changes priority but not the subject", async () => {
    const id = idOf(await create(customer));
    await assign(id, agent.user._id);
    const ok = await agent.http
      .patch(`/api/tickets/${id}`)
      .send({ priority: "HIGH" });
    expect(ok.body.data.ticket.priority).toBe("HIGH");
    const bad = await agent.http
      .patch(`/api/tickets/${id}`)
      .send({ subject: "Rewritten by agent" });
    expect(bad.status).toBe(403);
  });
});

describe("search, filters, sorting and pagination", () => {
  beforeEach(async () => {
    const createdBy = customer.user._id;
    const description = "A long enough description";
    await Ticket.create([
      {
        subject: "Refund not received",
        description,
        createdBy,
        category: "BILLING",
        priority: "HIGH",
      },
      {
        subject: "App crashes on start",
        description,
        createdBy,
        category: "TECHNICAL",
        priority: "URGENT",
        assignedTo: agent.user._id,
      },
      {
        subject: "Password reset help",
        description,
        createdBy,
        category: "ACCOUNT",
        priority: "LOW",
      },
    ]);
  });

  const get = (q = "") => admin.http.get(`/api/admin/tickets${q}`);

  it("filters by priority, category and assignee", async () => {
    expect((await get("?priority=HIGH")).body.data.pagination.total).toBe(1);
    expect((await get("?category=TECHNICAL")).body.data.pagination.total).toBe(
      1,
    );
    expect(
      (await get("?assignedTo=unassigned")).body.data.pagination.total,
    ).toBe(2);
    expect(
      (await get(`?assignedTo=${agent.user._id}`)).body.data.pagination.total,
    ).toBe(1);
  });

  it("searches by subject and ticket number", async () => {
    expect((await get("?search=refund")).body.data.pagination.total).toBe(1);
    expect((await get("?search=TKT-")).body.data.pagination.total).toBe(3);
  });

  it("filters by creation date range", async () => {
    expect((await get("?from=2999-01-01")).body.data.pagination.total).toBe(0);
    expect(
      (await get("?from=2000-01-01&to=2999-01-01")).body.data.pagination.total,
    ).toBe(3);
  });

  it("paginates", async () => {
    const res = await get("?page=2&limit=2");
    expect(res.body.data.tickets).toHaveLength(1);
    expect(res.body.data.pagination).toMatchObject({
      total: 3,
      pages: 2,
      page: 2,
    });
  });

  it("sorts by priority", async () => {
    const res = await get("?sortBy=priority&order=desc");
    expect(res.body.data.tickets.map((t) => t.priority)).toEqual([
      "URGENT",
      "HIGH",
      "LOW",
    ]);
  });

  it("rejects an invalid filter with 400", async () => {
    expect((await get("?status=BOGUS")).status).toBe(400);
  });

  it("only admins can use the admin list", async () => {
    expect((await customer.http.get("/api/admin/tickets")).status).toBe(403);
    expect((await agent.http.get("/api/admin/tickets")).status).toBe(403);
  });

  it("filters can never widen an agent's scope", async () => {
    const res = await agent.http.get("/api/tickets?assignedTo=unassigned");
    expect(res.body.data.pagination.total).toBe(0);
  });
});
