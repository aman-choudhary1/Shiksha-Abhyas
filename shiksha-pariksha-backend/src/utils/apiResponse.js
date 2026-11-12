class ApiResponse {
  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static created(res, data = null, message = 'Created') {
    return this.success(res, data, message, 201);
  }

  static error(res, message = 'An error occurred', statusCode = 500, details = null) {
    const body = { success: false, message };
    if (details && process.env.NODE_ENV !== 'production') body.details = details;
    return res.status(statusCode).json(body);
  }

  static validationError(res, errors, message = 'Validation failed') {
    return res.status(422).json({ success: false, message, errors });
  }

  static notFound(res, message = 'Resource not found') {
    return this.error(res, message, 404);
  }

  static unauthorized(res, message = 'Unauthorized') {
    return this.error(res, message, 401);
  }

  static forbidden(res, message = 'Forbidden') {
    return this.error(res, message, 403);
  }
}

module.exports = ApiResponse;
