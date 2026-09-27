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

test("concurrent mixed operations: bookings + cancellations + retries stay consistent", async () => {
  const admin = await makeAdmin();
  const user = await registerAndLogin();
  const event = await createEvent(admin.token, { totalSeats: 150 });

  // Stage 1: 100 concurrent bookings, each with its own idempotency key
  // (so we have real keys to retry against in stage 3)
  const bookingResults = await Promise.all(
    Array.from({ length: 100 }, (_, i) =>
      request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${user.token}`)
        .set("Idempotency-Key", `mixed-key-${i}`)
        .send({ eventId: event._id, quantity: 1 }),
    ),
  );

  const succeededBookings = bookingResults.filter((r) => r.status === 201);
  assert.equal(succeededBookings.length, 100);

  // Stage 2 + 3 concurrently: cancel the first 20 bookings, AND retry the
  // idempotency keys for a different 20 (keys 50-69) - all at once, mixed.
  const cancelPromises = succeededBookings
    .slice(0, 20)
    .map((r) =>
      request(app)
        .patch(`/api/bookings/${r.body.data.booking._id}/cancel`)
        .set("Authorization", `Bearer ${user.token}`),
    );

  const retryPromises = Array.from({ length: 20 }, (_, i) =>
    request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${user.token}`)
      .set("Idempotency-Key", `mixed-key-${50 + i}`) // reusing existing keys
      .send({ eventId: event._id, quantity: 1 }),
  );

  const [cancelResults, retryResults] = await Promise.all([
    Promise.all(cancelPromises),
    Promise.all(retryPromises),
  ]);

  // All 20 cancellations should succeed (each targets a distinct, still-CONFIRMED booking)
  assert.equal(cancelResults.filter((r) => r.status === 200).length, 20);

  // All 20 retries should succeed as replays (same key = same booking returned, not new ones)
  assert.equal(retryResults.filter((r) => r.status === 201).length, 20);
  const retryBookingIds = new Set(
    retryResults.map((r) => r.body.data.booking._id),
  );
  assert.equal(retryBookingIds.size, 20); // 20 distinct original bookings, not duplicated

  // Final consistency check - the actual point of Task 3
  const eventRes = await request(app)
    .get(`/api/events/${event._id}`)
    .set("Authorization", `Bearer ${user.token}`);
  const availableSeats = eventRes.body.data.event.availableSeats;

  const bookingsRes = await request(app)
    .get("/api/bookings?limit=100")
    .set("Authorization", `Bearer ${user.token}`);
  const activeBookedSeats = bookingsRes.body.data.bookings
    .filter((b) => b.status === "CONFIRMED")
    .reduce((sum, b) => sum + b.quantity, 0);

  assert.ok(availableSeats >= 0);
  assert.ok(availableSeats <= event.totalSeats);
  assert.equal(availableSeats + activeBookedSeats, event.totalSeats);

  // Sanity: 100 booked, 20 cancelled, retries didn't create new ones -> 80 active
  assert.equal(activeBookedSeats, 80);
  assert.equal(availableSeats, 70); // 150 - 80
});
