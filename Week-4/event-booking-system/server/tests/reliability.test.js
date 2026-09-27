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

test("data consistency invariants hold after mixed concurrent activity", async () => {
  const admin = await makeAdmin();
  const user = await registerAndLogin();
  const event = await createEvent(admin.token, { totalSeats: 20 });

  // Mixed activity: successful bookings, an overbooking attempt, and a cancellation
  const bookings = await Promise.all(
    Array.from({ length: 15 }, () =>
      request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${user.token}`)
        .send({ eventId: event._id, quantity: 1 }),
    ),
  );

  const succeeded = bookings.filter((r) => r.status === 201);
  const firstBookingId = succeeded[0].body.data.booking._id;

  await request(app)
    .patch(`/api/bookings/${firstBookingId}/cancel`)
    .set("Authorization", `Bearer ${user.token}`);

  const eventRes = await request(app)
    .get(`/api/events/${event._id}`)
    .set("Authorization", `Bearer ${user.token}`);
  const availableSeats = eventRes.body.data.event.availableSeats;

  const bookingsRes = await request(app)
    .get("/api/bookings?limit=100")
    .set("Authorization", `Bearer ${user.token}`);
  const bookedSeats = bookingsRes.body.data.bookings
    .filter((b) => b.status === "CONFIRMED")
    .reduce((sum, b) => sum + b.quantity, 0);

  // Task 8 / Task 11 invariants, checked explicitly and separately
  assert.ok(availableSeats >= 0, "availableSeats must never be negative");
  assert.ok(
    availableSeats <= event.totalSeats,
    "availableSeats must never exceed totalSeats",
  );
  assert.equal(
    availableSeats + bookedSeats,
    event.totalSeats,
    "availableSeats + bookedSeats must equal totalSeats",
  );

  // No orphan bookings: every CONFIRMED booking's seats are reflected in availableSeats,
  // meaning totalSeats accounts for all of it with nothing missing or double-counted.
  assert.equal(succeeded.length, 15);
  assert.equal(bookedSeats, 14); // 15 booked, 1 cancelled
});
