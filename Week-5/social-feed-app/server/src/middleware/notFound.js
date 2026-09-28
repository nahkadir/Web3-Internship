import { ApiError } from "../utils/ApiError.js";

// req, res, and next are the standard parameters Express gives to middleware
export const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// req = information about the incoming request.
// req.method → GET, POST, etc.
// req.originalUrl → /api/abc

// res → used to send a response. Not used here as the error handler will send the response.

// next → tells Express to move to the next middleware. Here, it passes the error to the error handler.
