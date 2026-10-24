import rateLimit from 'express-rate-limit';

function limiter(windowMinutes, max, message) {
	return rateLimit({
		windowMs: windowMinutes * 60 * 1000,
		max,
		standardHeaders: true,
		legacyHeaders: false,
		message: { message, code: 'RATE_LIMITED' }
	});
}

const TRY_LATER = 'Too many requests, please try again later.';

// Baseline for every API route
export const apiLimiter = limiter(15, 600, TRY_LATER);

export const loginLimiter = limiter(15, 20, 'Too many sign-in attempts, please try again later.');
export const registerLimiter = limiter(60, 10, 'Too many sign-up attempts, please try again later.');
export const codeLimiter = limiter(15, 20, TRY_LATER);
export const emailLimiter = limiter(15, 5, 'Too many emails requested, please try again later.');
export const refreshLimiter = limiter(15, 120, TRY_LATER);

// Public, unauthenticated lookups
export const trackingLimiter = limiter(15, 120, TRY_LATER);
export const geocodeLimiter = limiter(15, 300, TRY_LATER);
