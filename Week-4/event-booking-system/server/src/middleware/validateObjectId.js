import AppError from "../utils/AppError.js";

export const validateObjectId =
  (label = "resource", param = "id") =>
  (req, res, next) => {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params[param])) {
      return next(new AppError(`Invalid ${label} ID`, 400));
    }
    next();
  };
