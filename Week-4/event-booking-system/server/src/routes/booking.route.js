import { Router } from "express";
import { createBooking } from "../controllers/booking.controller.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createBookingSchema } from "../validators/booking.validator.js";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         userId: { type: string }
 *         eventId: { type: string }
 *         quantity: { type: integer, example: 2 }
 *         totalAmount: { type: number, example: 5000 }
 *         status: { type: string, enum: [PENDING, CONFIRMED, CANCELLED] }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     BookingInput:
 *       type: object
 *       required: [eventId, quantity]
 *       properties:
 *         eventId: { type: string, example: 64b7f0f0f0f0f0f0f0f0f0f0 }
 *         quantity: { type: integer, example: 2 }
 *     BookingResult:
 *       type: object
 *       properties:
 *         success: { type: boolean, example: true }
 *         message: { type: string }
 *         data:
 *           type: object
 *           properties:
 *             booking:
 *               $ref: '#/components/schemas/Booking'
 */

/**
 * @openapi
 * /bookings:
 *   post:
 *     tags: [Bookings]
 *     summary: Book seats for an event
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingInput'
 *     responses:
 *       201:
 *         description: Booking created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingResult'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post("/", protect, validate(createBookingSchema), createBooking);

export default router;
