const { verifyAccessToken } = require('../utils/jwt.utils');
const ApiResponse = require('../utils/apiResponse');

/**
 * Middleware: verifies Bearer token and attaches decoded user to req.user
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ApiResponse.unauthorized(res, 'No token provided');
  }

  const token = authHeader.slice(7);
  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Token expired — please refresh');
    }
    return ApiResponse.unauthorized(res, 'Invalid token');
  }
}

/**
 * Middleware factory: restricts access to specific roles
 * Usage: authorize('admin'), authorize('teacher','student')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return ApiResponse.unauthorized(res);
    if (!roles.includes(req.user.role)) {
      return ApiResponse.forbidden(res, `Access denied. Required role: ${roles.join(' or ')}`);
    }
    return next();
  };
}

module.exports = { authenticate, authorize };
