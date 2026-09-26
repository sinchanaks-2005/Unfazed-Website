/**
 * Centralized error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error("Unhandled Error:", err.stack || err.message);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    message: err.message || "Internal server error",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

module.exports = errorHandler;

