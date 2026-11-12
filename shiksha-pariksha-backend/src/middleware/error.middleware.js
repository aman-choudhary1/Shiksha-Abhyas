const ApiResponse = require('../utils/apiResponse');

function errorHandler(err, req, res, next) {
  const status  = err.statusCode || err.status || 500;
  const message = err.message    || 'Internal server error';

  if (status >= 500) {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.stack || err.message);
  }

  return ApiResponse.error(res, message, status, err.errors || null);
}

function notFoundHandler(req, res) {
  return ApiResponse.notFound(res, `Route not found: ${req.method} ${req.originalUrl}`);
}

module.exports = { errorHandler, notFoundHandler };
