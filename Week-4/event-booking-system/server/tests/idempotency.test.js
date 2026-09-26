import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import {
  connectTestDB,
  disconnectTestDB,
  clearCollections,
} from "./helpers/setup.js";
import { registerAndLogin, makeAdmin, createEvent } from "./helpers/factory.js";

before(connectTestDB);
after(disconnectTestDB);
beforeEach(clearCollections);

test("idempotency: repeat request with same key replays original booking", async () => {
  const admin = await makeAdmin();
  const user = await registerAndLogin();
  const event = await createEvent(admin.token, { totalSeats: 10 });

  const first = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${user.token}`)
    .set("Idempotency-Key", "key-abc")
    .send({ eventId: event._id, quantity: 2 });

  const second = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${user.token}`)
    .set("Idempotency-Key", "key-abc")
    .send({ eventId: event._id, quantity: 2 });

  assert.equal(first.status, 201);
  assert.equal(second.status, 201);
  assert.equal(second.body.data.booking._id, first.body.data.booking._id);

  const eventRes = await request(app)
    .get(`/api/events/${event._id}`)
    .set("Authorization", `Bearer ${user.token}`);

  assert.equal(eventRes.body.data.event.availableSeats, 8); // deducted once, not twice
});

test("idempotency: same key, different payload is rejected", async () => {
  const admin = await makeAdmin();
  const user = await registerAndLogin();
  const event = await createEvent(admin.token, { totalSeats: 10 });

  await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${user.token}`)
    .set("Idempotency-Key", "key-xyz")
    .send({ eventId: event._id, quantity: 2 });

  const mismatched = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${user.token}`)
    .set("Idempotency-Key", "key-xyz")
    .send({ eventId: event._id, quantity: 5 });

  assert.equal(mismatched.status, 422);
});

test("idempotency: 20 concurrent identical requests create exactly one booking", async () => {
  const admin = await makeAdmin();
  const user = await registerAndLogin();
  const event = await createEvent(admin.token, { totalSeats: 5 });

  const results = await Promise.all(
    Array.from({ length: 20 }, () =>
      request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${user.token}`)
        .set("Idempotency-Key", "concurrent-key-1")
        .send({ eventId: event._id, quantity: 2 }),
    ),
  );

  // Every response must be either a successful replay (201) or a
  // "still processing" conflict (409) - never a 500, never a second
  // distinct booking.
  const statuses = results.map((r) => r.status);
  const unexpected = statuses.filter((s) => s !== 201 && s !== 409);
  assert.deepEqual(unexpected, []);

  const succeeded = results.filter((r) => r.status === 201);
  const bookingIds = new Set(succeeded.map((r) => r.body.data.booking._id));
  assert.equal(bookingIds.size, 1); // all 201s point to the SAME booking

  const bookingsRes = await request(app)
    .get("/api/bookings")
    .set("Authorization", `Bearer ${user.token}`);
  assert.equal(bookingsRes.body.data.bookings.length, 1); // exactly one booking created

  const eventRes = await request(app)
    .get(`/api/events/${event._id}`)
    .set("Authorization", `Bearer ${user.token}`);
  assert.equal(eventRes.body.data.event.availableSeats, 3); // 5 - 2, deducted exactly once
});
