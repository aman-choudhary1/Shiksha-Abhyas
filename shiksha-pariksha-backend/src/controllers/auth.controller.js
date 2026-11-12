const AuthService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');

const REFRESH_COOKIE = 'sp_refresh';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
  path:     '/api/auth',
};

class AuthController {
  static async login(req, res, next) {
    try {
      const { identifier, password } = req.body;
      if (!identifier || !password) {
        return ApiResponse.error(res, 'identifier (email/phone) and password are required', 400);
      }

      const result = await AuthService.login(identifier, password);

      // Set refresh token as httpOnly cookie
      res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);

      return ApiResponse.success(res, {
        accessToken: result.accessToken,
        user: result.user,
      }, 'Login successful');
    } catch (err) {
      next(err);
    }
  }

  static async refresh(req, res, next) {
    try {
      const plainToken = req.cookies?.[REFRESH_COOKIE];
      if (!plainToken) return ApiResponse.unauthorized(res, 'No refresh token');

      const result = await AuthService.refresh(plainToken);
      return ApiResponse.success(res, { accessToken: result.accessToken }, 'Token refreshed');
    } catch (err) {
      next(err);
    }
  }

  static async logout(req, res, next) {
    try {
      const plainToken = req.cookies?.[REFRESH_COOKIE];
      await AuthService.logout(plainToken);
      res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
      return ApiResponse.success(res, null, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  }

  static async register(req, res, next) {
    try {
      const { full_name, email, phone, password, role } = req.body;
      if (!full_name || !password || !role) {
        return ApiResponse.error(res, 'full_name, password, and role are required', 400);
      }
      if (!email && !phone) {
        return ApiResponse.error(res, 'At least one of email or phone is required', 400);
      }
      if (password.length < 6) {
        return ApiResponse.error(res, 'Password must be at least 6 characters', 400);
      }

      const user = await AuthService.register({ full_name, email, phone, password, role });
      return ApiResponse.created(res, user, 'Account created successfully');
    } catch (err) {
      next(err);
    }
  }

  static async adminCreateUser(req, res, next) {
    try {
      const { full_name, email, phone, password, role } = req.body;
      if (!full_name || !password || !role) {
        return ApiResponse.error(res, 'full_name, password, and role are required', 400);
      }

      const user = await AuthService.adminCreateUser(
        { full_name, email, phone, password, role },
        req.user.id
      );
      return ApiResponse.created(res, user, 'User created successfully');
    } catch (err) {
      next(err);
    }
  }

  static async me(req, res) {
    return ApiResponse.success(res, req.user, 'Current user');
  }
}

module.exports = AuthController;
