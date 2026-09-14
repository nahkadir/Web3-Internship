// Because this function has 4 parameters, Express recognizes it as an error-handling middleware
// error that occured, request, response & next (move to another middleware)

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  // print full error details in server terminal

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  // if the error has its own status code & message, use it.
  // Else: 500, Internal Server Error

  // JSON is the common format used for API communication
  res.status(statusCode).json({
    success: false,
    message,
    // The stack contains technical details about the backend code for developing, but don't want to expose them to users in production
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

export default errorHandler;
