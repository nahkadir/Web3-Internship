import Event from "../models/Event.js";
import AppError from "../utils/AppError.js";

export const createEvent = async (data, userId) =>
  Event.create({ ...data, createdBy: userId });

export const listEvents = async ({ status, available, page, limit }) => {
  const filter = {};
  if (status) filter.status = status;
  if (available) filter.availableSeats = available === "true" ? { $gt: 0 } : 0;

  const [events, total] = await Promise.all([
    Event.find(filter)
      .sort({ startDate: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Event.countDocuments(filter),
  ]);

  return {
    events,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getEventById = async (id) => {
  const event = await Event.findById(id);
  if (!event) throw new AppError("Event not found", 404);
  return event;
};

export const updateEvent = async (id, data) => {
  const event = await getEventById(id);
  const { totalSeats, ...rest } = data;

  const startDate = rest.startDate ?? event.startDate;
  const endDate = rest.endDate ?? event.endDate;
  if (endDate <= startDate) {
    throw new AppError("Validation failed", 400, [
      { field: "endDate", message: "endDate must be after startDate" },
    ]);
  }

  if (totalSeats !== undefined) {
    const booked = event.totalSeats - event.availableSeats;
    if (totalSeats < booked) {
      throw new AppError(
        `totalSeats cannot be less than already booked seats (${booked})`,
        409,
      );
    }
    event.totalSeats = totalSeats;
    event.availableSeats = totalSeats - booked;
  }

  Object.assign(event, rest);
  await event.save();
  return event;
};

export const deleteEvent = async (id) => {
  const event = await getEventById(id);

  if (event.availableSeats < event.totalSeats) {
    throw new AppError(
      "Event has bookings and cannot be deleted. Cancel it instead by setting its status to CANCELLED.",
      409,
    );
  }

  await event.deleteOne();
};
