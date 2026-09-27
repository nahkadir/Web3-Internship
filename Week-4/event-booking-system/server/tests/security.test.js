import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import {
  connectTestDB,
  disconnectTestDB,
  clearCollections,
} from "./helpers/setup.js";
import { makeAdmin, createEvent } from "./helpers/factory.js";

before(connectTestDB);
after(disconnectTestDB);
beforeEach(clearCollections);

test("security: availableSeats cannot be set directly via PATCH /events/:id (field alone)", async () => {
  const admin = await makeAdmin();
  const event = await createEvent(admin.token, { totalSeats: 10 });

  const res = await request(app)
    .patch(`/api/events/${event._id}`)
    .set("Authorization", `Bearer ${admin.token}`)
    .send({ availableSeats: 999 });

  // availableSeats isn't a recognized field, so it's stripped - leaving
  // nothing to update, which the schema correctly rejects.
  assert.equal(res.status, 400);
});

test("security: availableSeats is silently stripped even when sent alongside a valid field", async () => {
  const admin = await makeAdmin();
  const event = await createEvent(admin.token, { totalSeats: 10 });

  const res = await request(app)
    .patch(`/api/events/${event._id}`)
    .set("Authorization", `Bearer ${admin.token}`)
    .send({ price: 5000, availableSeats: 999 }); // legitimate field + injection attempt

  assert.equal(res.status, 200);
  assert.equal(res.body.data.event.price, 5000); // the valid field DID update
  assert.equal(res.body.data.event.availableSeats, 10); // but availableSeats was ignored, untouched
});

test("edge case: overly long idempotency key is rejected", async () => {
  const admin = await makeAdmin();
  const event = await createEvent(admin.token, { totalSeats: 10 });

  const overlyLongKey = "x".repeat(300);

  const res = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${admin.token}`)
    .set("Idempotency-Key", overlyLongKey)
    .send({ eventId: event._id, quantity: 1 });

  assert.equal(res.status, 400);
});
