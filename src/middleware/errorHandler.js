function errorHandler(err, req, res, next) {
  console.error("ERROR LOG:", new Date().toLocaleString());
  console.error("Request:", req.method, req.path);
  console.error(err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada server.',
  });
}

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);


module.exports = { errorHandler, AppError, asyncHandler };