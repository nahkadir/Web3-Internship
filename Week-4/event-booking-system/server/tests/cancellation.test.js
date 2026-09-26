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

test("concurrent cancellation: 10 simultaneous cancels on one booking restore seats exactly once", async () => {
  const admin = await makeAdmin();
  const user = await registerAndLogin();
  const event = await createEvent(admin.token, { totalSeats: 10 });

  const bookingRes = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${user.token}`)
    .send({ eventId: event._id, quantity: 4 });

  const bookingId = bookingRes.body.data.booking._id;

  const results = await Promise.all(
    Array.from({ length: 10 }, () =>
      request(app)
        .patch(`/api/bookings/${bookingId}/cancel`)
        .set("Authorization", `Bearer ${user.token}`),
    ),
  );

  const succeeded = results.filter((r) => r.status === 200);
  const failed = results.filter((r) => r.status === 409);

  assert.equal(succeeded.length, 1); // exactly one cancellation wins
  assert.equal(failed.length, 9); // the rest see it's already cancelled

  const eventRes = await request(app)
    .get(`/api/events/${event._id}`)
    .set("Authorization", `Bearer ${user.token}`);

  // Started at 10, booked 4 -> 6, cancelled once -> +4 = 10. NOT +40 = 46.
  assert.equal(eventRes.body.data.event.availableSeats, 10);
});
