import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, refresh, logout, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema } from '../validators/schemas.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many failed login attempts. Please try again after 15 minutes.'
  }
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many token refresh attempts. Please try again shortly.'
  }
});

router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/refresh', refreshLimiter, refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;
