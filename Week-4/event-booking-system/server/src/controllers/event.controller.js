import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import * as eventService from "../services/event.service.js";

export const createEvent = asyncHandler(async (req, res) => {
  const event = await eventService.createEvent(req.body, req.user._id);
  sendSuccess(res, {
    statusCode: 201,
    message: "Event created successfully",
    data: { event },
  });
});

export const getEvents = asyncHandler(async (req, res) => {
  const data = await eventService.listEvents(req.validated.query);
  sendSuccess(res, { message: "Events fetched", data });
});

export const getEvent = asyncHandler(async (req, res) => {
  const event = await eventService.getEventById(req.params.id);
  sendSuccess(res, { message: "Event fetched", data: { event } });
});

export const updateEvent = asyncHandler(async (req, res) => {
  const event = await eventService.updateEvent(req.params.id, req.body);
  sendSuccess(res, { message: "Event updated successfully", data: { event } });
});

export const deleteEvent = asyncHandler(async (req, res) => {
  await eventService.deleteEvent(req.params.id);
  sendSuccess(res, { message: "Event deleted successfully" });
});
