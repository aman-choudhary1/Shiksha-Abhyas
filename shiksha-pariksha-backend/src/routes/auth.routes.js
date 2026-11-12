const express  = require('express');
const rateLimit = require('express-rate-limit');
const AuthController = require('../controllers/auth.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: process.env.NODE_ENV === 'production' ? 10 : 100,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== 'production',
});

// Public routes
router.post('/login',    loginLimiter, AuthController.login);
router.post('/refresh',               AuthController.refresh);
router.post('/logout',                AuthController.logout);
router.post('/register',              AuthController.register);

// Protected routes
router.get('/me', authenticate, AuthController.me);
router.post('/admin/users', authenticate, authorize('admin'), AuthController.adminCreateUser);

module.exports = router;
