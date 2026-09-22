import mongoose from "mongoose";
import Event from "../models/Event.js";
import Booking from "../models/Booking.js";
import AppError from "../utils/AppError.js";

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
        { new: true, session },
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
    });

    return booking;
  } finally {
    await session.endSession();
  }
};
