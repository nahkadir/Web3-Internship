import mongoose from "mongoose";
import Event from "../models/Event.js";
import Booking from "../models/Booking.js";
import AppError from "../utils/AppError.js";
import { isTransitionAllowed } from "../utils/bookingStateMachine.js";

export const createBooking = async (userId, { eventId, quantity }) => {
  const session = await mongoose.startSession();

  try {
    let booking;

    await session.withTransaction(async () => {
      const event = await Event.findById(eventId).session(session);
      if (!event) throw new AppError("Event not found", 404);

      if (event.status === "CANCELLED") {
        throw new AppError("Event is cancelled", 409);
      }
      if (event.status === "COMPLETED" || event.endDate < new Date()) {
        throw new AppError("Event has already ended", 409);
      }
      if (event.status !== "UPCOMING" && event.status !== "ONGOING") {
        throw new AppError("Event is not available for booking", 409);
      }

      // Atomic conditional deduction: only succeeds if enough seats remain,
      // so two concurrent requests can't both pass a separate read-then-check.
      const updatedEvent = await Event.findOneAndUpdate(
        { _id: eventId, availableSeats: { $gte: quantity } },
        { $inc: { availableSeats: -quantity } },
        { returnDocument: "after", session },
      );

      if (!updatedEvent) {
        throw new AppError("Not enough seats available", 409);
      }

      const totalAmount = updatedEvent.price * quantity;

      const created = await Booking.create(
        [{ userId, eventId, quantity, totalAmount, status: "CONFIRMED" }],
        { session },
      );
      booking = created[0];

      // TEMP: Day 4 Task 6 reverse-scenario test hook - remove after testing
      // if (globalThis.__TEST_FAIL_AFTER_BOOKING_CREATE__) {
      //   throw new Error("Simulated failure after booking creation");
      // }
    });

    return booking;
  } finally {
    await session.endSession();
  }
};

export const listMyBookings = async (userId) =>
  Booking.find({ userId })
    .sort({ createdAt: -1 })
    .populate("eventId", "title startDate location status");

export const getMyBookingById = async (userId, bookingId) => {
  const booking = await Booking.findById(bookingId).populate(
    "eventId",
    "title startDate location status",
  );

  if (!booking) throw new AppError("Booking not found", 404);
  if (!booking.userId.equals(userId)) {
    throw new AppError("You do not have access to this booking", 403);
  }

  return booking;
};

export const cancelBooking = async (userId, bookingId) => {
  const session = await mongoose.startSession();

  try {
    let booking;

    await session.withTransaction(async () => {
      const existing = await Booking.findById(bookingId).session(session);
      if (!existing) throw new AppError("Booking not found", 404);
      if (!existing.userId.equals(userId)) {
        throw new AppError("You do not have access to this booking", 403);
      }
      if (existing.status === "CANCELLED") {
        throw new AppError("Booking is already cancelled", 409);
      }

      if (!isTransitionAllowed(existing.status, "CANCELLED")) {
        throw new AppError(
          `Cannot cancel a booking with status ${existing.status}`,
          409,
        );
      }

      // Atomic status flip: only succeeds if the booking is still cancellable
      // at the moment of the update, so two simultaneous cancel calls can't
      // both pass and restore seats twice.
      const updated = await Booking.findOneAndUpdate(
        { _id: bookingId, status: { $ne: "CANCELLED" } },
        { status: "CANCELLED" },
        { returnDocument: "after", session },
      );

      if (!updated) {
        throw new AppError("Booking is already cancelled", 409);
      }

      await Event.findByIdAndUpdate(
        updated.eventId,
        { $inc: { availableSeats: updated.quantity } },
        { session },
      );

      booking = updated;
    });

    return booking;
  } finally {
    await session.endSession();
  }
};
