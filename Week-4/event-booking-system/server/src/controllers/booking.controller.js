import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import * as bookingService from "../services/booking.service.js";
import { withIdempotency } from "../services/idempotency.service.js";
import AppError from "../utils/AppError.js";

export const createBooking = asyncHandler(async (req, res) => {
  const idempotencyKey = req.headers["idempotency-key"];

  if (
    idempotencyKey &&
    (idempotencyKey.length < 1 || idempotencyKey.length > 255)
  ) {
    throw new AppError(
      "Invalid Idempotency-Key: must be between 1 and 255 characters",
      400,
    );
  }

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
  const data = await bookingService.listMyBookings(
    req.user._id,
    req.validated.query,
  );
  sendSuccess(res, { message: "Bookings fetched", data });
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
