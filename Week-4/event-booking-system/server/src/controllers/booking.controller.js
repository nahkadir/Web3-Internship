import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import * as bookingService from "../services/booking.service.js";
import { withIdempotency } from "../services/idempotency.service.js";

export const createBooking = asyncHandler(async (req, res) => {
  const idempotencyKey = req.headers["idempotency-key"];

  // No key provided: behave exactly as before, no idempotency guarantee.
  if (!idempotencyKey) {
    const booking = await bookingService.createBooking(req.user._id, req.body);
    return sendSuccess(res, {
      statusCode: 201,
      message: "Booking created successfully",
      data: { booking },
    });
  }

  const { statusCode, body } = await withIdempotency(
    req.user._id,
    idempotencyKey,
    req.body,
    async () => {
      const booking = await bookingService.createBooking(
        req.user._id,
        req.body,
      );
      return {
        statusCode: 201,
        body: {
          success: true,
          message: "Booking created successfully",
          data: { booking },
        },
      };
    },
  );

  res.status(statusCode).json(body);
});

export const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await bookingService.listMyBookings(req.user._id);
  sendSuccess(res, { message: "Bookings fetched", data: { bookings } });
});

export const getMyBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.getMyBookingById(
    req.user._id,
    req.params.id,
  );
  sendSuccess(res, { message: "Booking fetched", data: { booking } });
});

export const cancelMyBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.cancelBooking(
    req.user._id,
    req.params.id,
  );
  sendSuccess(res, {
    message: "Booking cancelled successfully",
    data: { booking },
  });
});
