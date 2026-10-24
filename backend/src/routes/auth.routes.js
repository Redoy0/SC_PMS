import { Router } from 'express';
import {
	register, verifyEmail, resendVerification, login, refresh, logout, forgotPassword, resetPassword
} from '../controllers/auth.controller.js';
import {
	loginLimiter, registerLimiter, codeLimiter, emailLimiter, refreshLimiter
} from '../middleware/rateLimits.js';
import { requireXhr } from '../middleware/auth.js';

const router = Router();

router.post('/register', registerLimiter, register);
router.post('/verify-email', codeLimiter, verifyEmail);
router.post('/resend-verification', emailLimiter, resendVerification);
router.post('/login', loginLimiter, login);
router.post('/forgot-password', emailLimiter, forgotPassword);
router.post('/reset-password', codeLimiter, resetPassword);

// These two act on the refresh cookie, so they also require a custom header
// that a cross-site form or image request cannot send (CSRF defence).
router.post('/refresh', refreshLimiter, requireXhr, refresh);
router.post('/logout', requireXhr, logout);

export default router;
