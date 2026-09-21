import { Router } from "express";
import {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/event.controller.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import {
  createEventSchema,
  updateEventSchema,
  listEventsQuerySchema,
} from "../validators/event.validator.js";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         title: { type: string, example: Tech Conference 2026 }
 *         description: { type: string, example: Annual technology conference }
 *         location: { type: string, example: Lahore Expo Center }
 *         startDate: { type: string, format: date-time }
 *         endDate: { type: string, format: date-time }
 *         totalSeats: { type: integer, example: 100 }
 *         availableSeats: { type: integer, example: 100 }
 *         price: { type: number, example: 2500 }
 *         status: { type: string, enum: [UPCOMING, ONGOING, COMPLETED, CANCELLED] }
 *         createdBy: { type: string }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     EventInput:
 *       type: object
 *       required: [title, description, location, startDate, endDate, totalSeats, price]
 *       properties:
 *         title: { type: string, example: Tech Conference 2026 }
 *         description: { type: string, example: Annual technology conference }
 *         location: { type: string, example: Lahore Expo Center }
 *         startDate: { type: string, format: date-time, example: '2026-12-10T09:00:00.000Z' }
 *         endDate: { type: string, format: date-time, example: '2026-12-10T17:00:00.000Z' }
 *         totalSeats: { type: integer, example: 100 }
 *         price: { type: number, example: 2500 }
 *     EventUpdate:
 *       type: object
 *       properties:
 *         title: { type: string }
 *         description: { type: string }
 *         location: { type: string }
 *         startDate: { type: string, format: date-time }
 *         endDate: { type: string, format: date-time }
 *         totalSeats: { type: integer }
 *         price: { type: number }
 *         status: { type: string, enum: [UPCOMING, ONGOING, COMPLETED, CANCELLED] }
 *     EventResult:
 *       type: object
 *       properties:
 *         success: { type: boolean, example: true }
 *         message: { type: string }
 *         data:
 *           type: object
 *           properties:
 *             event:
 *               $ref: '#/components/schemas/Event'
 *     EventList:
 *       type: object
 *       properties:
 *         success: { type: boolean, example: true }
 *         message: { type: string, example: Events fetched }
 *         data:
 *           type: object
 *           properties:
 *             events:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *             pagination:
 *               type: object
 *               properties:
 *                 page: { type: integer }
 *                 limit: { type: integer }
 *                 total: { type: integer }
 *                 totalPages: { type: integer }
 */

/**
 * @openapi
 * /events:
 *   get:
 *     tags: [Events]
 *     summary: List events (any authenticated user)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [UPCOMING, ONGOING, COMPLETED, CANCELLED] }
 *       - in: query
 *         name: available
 *         description: true = has free seats, false = sold out
 *         schema: { type: string, enum: ['true', 'false'] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Events fetched
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventList'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     tags: [Events]
 *     summary: Create an event (ADMIN). availableSeats is set to totalSeats automatically.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventInput'
 *     responses:
 *       201:
 *         description: Event created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventResult'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @openapi
 * /events/{id}:
 *   get:
 *     tags: [Events]
 *     summary: Get event details (any authenticated user)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Event fetched
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventResult'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   patch:
 *     tags: [Events]
 *     summary: Update an event (ADMIN). Changing totalSeats keeps availableSeats consistent with booked seats.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventUpdate'
 *     responses:
 *       200:
 *         description: Event updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventResult'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *   delete:
 *     tags: [Events]
 *     summary: Delete an event (ADMIN)
 *     description: >
 *       Only events with no booked seats (availableSeats equals totalSeats) can be deleted.
 *       Events that already have bookings return 409 and must be cancelled by setting
 *       status to CANCELLED via PATCH.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Event deleted
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */

router.use(protect);

router.get("/", validate(listEventsQuerySchema, "query"), getEvents);
router.get("/:id", validateObjectId("event"), getEvent);

router.post("/", authorize("ADMIN"), validate(createEventSchema), createEvent);
router.patch(
  "/:id",
  authorize("ADMIN"),
  validateObjectId("event"),
  validate(updateEventSchema),
  updateEvent,
);
router.delete(
  "/:id",
  authorize("ADMIN"),
  validateObjectId("event"),
  deleteEvent,
);

export default router;
