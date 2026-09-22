import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import * as bookingService from "../services/booking.service.js";

export const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking(req.user._id, req.body);
  sendSuccess(res, {
    statusCode: 201,
    message: "Booking created successfully",
    data: { booking },
  });
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
