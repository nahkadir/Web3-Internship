// automatically catch errors from async Express route handlers and pass them to Express's errorHandler

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
