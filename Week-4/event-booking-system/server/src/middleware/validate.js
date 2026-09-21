import AppError from "../utils/AppError.js";

export const validate =
  (schema, source = "body") =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return next(new AppError("Validation failed", 400, errors));
    }

    req.validated = { ...req.validated, [source]: result.data };
    if (source === "body") req.body = result.data;
    next();
  };
