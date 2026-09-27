import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import {
  connectTestDB,
  disconnectTestDB,
  clearCollections,
} from "./helpers/setup.js";
import User from "../src/models/User.js";

before(connectTestDB);
after(disconnectTestDB);
beforeEach(clearCollections);

test("complete end-to-end booking journey", async () => {
  // 1. Register
  const email = `journey_${Date.now()}@test.com`;
  const registerRes = await request(app)
    .post("/api/auth/register")
    .send({ name: "Journey User", email, password: "password123" });

  assert.equal(registerRes.status, 201);
  assert.equal(registerRes.body.data.user.password, undefined); // password never returned

  // 2. Login
  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "password123" });

  assert.equal(loginRes.status, 200);
  const token = loginRes.body.data.token;
  assert.ok(token);

  // Set up an event as admin (out of the user's own journey, but needed to have something to book)
  await User.findByIdAndUpdate(registerRes.body.data.user._id, {
    role: "ADMIN",
  });
  const adminLogin = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "password123" });
  const adminToken = adminLogin.body.data.token;

  const eventRes = await request(app)
    .post("/api/events")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      title: "Journey Test Event",
      description: "End-to-end test event",
      location: "Test City",
      startDate: "2026-12-15T09:00:00.000Z",
      endDate: "2026-12-15T17:00:00.000Z",
      totalSeats: 10,
      price: 1500,
    });
  const eventId = eventRes.body.data.event._id;

  // Demote back to a normal user for the rest of the journey - reflects a real
  // attendee, not the admin who happened to create the event.
  await User.findByIdAndUpdate(registerRes.body.data.user._id, {
    role: "USER",
  });
  const userLogin = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "password123" });
  const userToken = userLogin.body.data.token;

  // 3. View events
  const listRes = await request(app)
    .get("/api/events")
    .set("Authorization", `Bearer ${userToken}`);

  assert.equal(listRes.status, 200);
  const listedEvent = listRes.body.data.events.find((e) => e._id === eventId);
  assert.ok(listedEvent, "created event must appear in the list");
  assert.equal(listedEvent.availableSeats, 10); // accurate seat count before any booking

  // 4. View event details
  const detailRes = await request(app)
    .get(`/api/events/${eventId}`)
    .set("Authorization", `Bearer ${userToken}`);

  assert.equal(detailRes.status, 200);
  assert.equal(detailRes.body.data.event.availableSeats, 10);

  // 5. Book seats
  const bookRes = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${userToken}`)
    .send({ eventId, quantity: 3 });

  assert.equal(bookRes.status, 201);
  const bookingId = bookRes.body.data.booking._id;
  // Amount calculated by the backend (price 1500 x quantity 3), never trusted from the client
  assert.equal(bookRes.body.data.booking.totalAmount, 4500);

  // Successful booking reduces available seats
  const afterBookRes = await request(app)
    .get(`/api/events/${eventId}`)
    .set("Authorization", `Bearer ${userToken}`);
  assert.equal(afterBookRes.body.data.event.availableSeats, 7);

  // 6. View booking
  const viewBookingRes = await request(app)
    .get(`/api/bookings/${bookingId}`)
    .set("Authorization", `Bearer ${userToken}`);

  assert.equal(viewBookingRes.status, 200);
  assert.equal(viewBookingRes.body.data.booking.quantity, 3);
  assert.equal(viewBookingRes.body.data.booking.status, "CONFIRMED");

  // Users can only access their own bookings - a second user must not see this one
  const otherRegister = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Other User",
      email: `other_${Date.now()}@test.com`,
      password: "password123",
    });
  const otherLogin = await request(app)
    .post("/api/auth/login")
    .send({
      email: otherRegister.body.data.user.email,
      password: "password123",
    });
  const otherToken = otherLogin.body.data.token;

  const forbiddenRes = await request(app)
    .get(`/api/bookings/${bookingId}`)
    .set("Authorization", `Bearer ${otherToken}`);
  assert.equal(forbiddenRes.status, 403);

  // Invalid operation: booking more than what's now available (7 left, ask for 100)
  const invalidBookRes = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${userToken}`)
    .send({ eventId, quantity: 100 });
  assert.equal(invalidBookRes.status, 409);

  // 7. Cancel booking
  const cancelRes = await request(app)
    .patch(`/api/bookings/${bookingId}/cancel`)
    .set("Authorization", `Bearer ${userToken}`);

  assert.equal(cancelRes.status, 200);
  assert.equal(cancelRes.body.data.booking.status, "CANCELLED");

  // 8. Verify seats restored
  const finalEventRes = await request(app)
    .get(`/api/events/${eventId}`)
    .set("Authorization", `Bearer ${userToken}`);
  assert.equal(finalEventRes.body.data.event.availableSeats, 10);
});
