import { AppError } from "../utils/AppError.js";

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      field: i.path.slice(1).join("."),
      message: i.message,
    }));
    return next(new AppError("Validation failed", 400, details));
  }

  const { body, query, params } = result.data;
  if (body !== undefined) req.body = body;
  req.validated = { query: query ?? {}, params: params ?? {} };
  next();
};
