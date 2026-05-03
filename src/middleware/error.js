export function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

export function errorHandler(error, req, res, next) {
  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation failed.",
      details: Object.values(error.errors).map((item) => item.message)
    });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || error.keyValue || {})[0] || "field";
    return res.status(409).json({ message: `${field} already exists.` });
  }

  const status = error.status || 500;
  const message = status === 500 ? "Server error." : error.message;

  if (status === 500) {
    console.error(error);
  }

  res.status(status).json({ message });
}
