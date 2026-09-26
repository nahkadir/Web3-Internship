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

test("reverse scenario: booking creation succeeds but a later step fails, everything rolls back", async () => {
  const admin = await makeAdmin();
  const user = await registerAndLogin();
  const event = await createEvent(admin.token, { totalSeats: 10 });

  globalThis.__TEST_FAIL_AFTER_BOOKING_CREATE__ = true;

  const res = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${user.token}`)
    .send({ eventId: event._id, quantity: 3 });

  globalThis.__TEST_FAIL_AFTER_BOOKING_CREATE__ = false;

  assert.equal(res.status, 500);

  // Seats were never actually deducted, despite the deduction step "succeeding"
  // inside the transaction - the whole transaction was discarded.
  const eventRes = await request(app)
    .get(`/api/events/${event._id}`)
    .set("Authorization", `Bearer ${user.token}`);
  assert.equal(eventRes.body.data.event.availableSeats, 10);

  // No orphan booking exists either, even though Booking.create() ran
  // "successfully" before the later failure.
  const bookingsRes = await request(app)
    .get("/api/bookings")
    .set("Authorization", `Bearer ${user.token}`);
  assert.equal(bookingsRes.body.data.bookings.length, 0);
});
