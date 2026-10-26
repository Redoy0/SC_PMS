import bcrypt from 'bcryptjs';
import { User, MAX_FAILED_LOGINS, LOCK_MINUTES } from '../models/User.js';
import { signAccessToken } from '../utils/jwt.js';
import { numericCode, randomToken, sha256, safeEqualHex } from '../utils/tokens.js';
import {
	normalizeEmail, normalizeName, normalizePhone, passwordPolicyError, isNonEmptyString
} from '../utils/validation.js';
import {
	appUrl, isMailConfigured, MailNotConfiguredError,
	sendVerificationCodeEmail, sendPasswordResetEmail
} from '../utils/mailer.js';
import {
	startSession, rotateSession, endSession, revokeAllSessions, clearRefreshCookie
} from '../services/session.service.js';

const CODE_TTL_MIN = 10;
const MAX_CODE_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;
const RESET_TTL_MIN = 30;

// EMAIL_VERIFICATION=off disables the verification step (e.g. for an offline demo)
const verificationRequired = (process.env.EMAIL_VERIFICATION || 'required').toLowerCase() !== 'off';

if (verificationRequired && !isMailConfigured && process.env.NODE_ENV === 'production') {
	console.warn('[auth] EMAIL_VERIFICATION is required but neither BREVO_API_KEY nor MAIL_USER/MAIL_PASS is set: new sign-ups will fail.');
}

// Used to keep response time the same whether or not an email exists
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-not-a-real-password', 10);

function fail(res, status, message, code) {
	return res.status(status).json({ message, ...(code ? { code } : {}) });
}

async function issueVerificationCode(user) {
	const code = numericCode(6);
	user.emailVerification = {
		codeHash: sha256(code),
		expiresAt: new Date(Date.now() + CODE_TTL_MIN * 60 * 1000),
		attempts: 0,
		lastSentAt: new Date()
	};
	await user.save();
	await sendVerificationCodeEmail({ to: user.email, name: user.name, code, minutes: CODE_TTL_MIN });
}

async function signIn(res, req, user, { persistent = false, status = 200 } = {}) {
	user.lastLoginAt = new Date();
	await user.save();
	await startSession(res, req, user, { persistent });
	return res.status(status).json({ user: user.toPublic(), accessToken: signAccessToken(user) });
}

export async function register(req, res) {
	try {
		const { name, email, phone, password, acceptTerms } = req.body || {};

		const cleanName = normalizeName(name);
		const cleanEmail = normalizeEmail(email);
		const cleanPhone = normalizePhone(phone);
		if (!cleanName) return fail(res, 400, 'Please enter your full name (2-80 characters)', 'INVALID_NAME');
		if (!cleanEmail) return fail(res, 400, 'Please enter a valid email address', 'INVALID_EMAIL');
		if (!cleanPhone) return fail(res, 400, 'Please enter a valid Bangladeshi mobile number (01XXXXXXXXX)', 'INVALID_PHONE');
		const pwError = passwordPolicyError(password);
		if (pwError) return fail(res, 400, pwError, 'WEAK_PASSWORD');
		if (acceptTerms !== true) return fail(res, 400, 'You must accept the terms to create an account', 'TERMS_REQUIRED');

		if (verificationRequired && !isMailConfigured && process.env.NODE_ENV === 'production') {
			return fail(res, 503, 'Sign-up is temporarily unavailable. Please try again later.', 'MAIL_UNAVAILABLE');
		}

		let user = await User.findOne({ email: cleanEmail });
		if (user && user.emailVerified !== false) {
			return fail(res, 409, 'An account with this email already exists. Please sign in.', 'EMAIL_TAKEN');
		}
		if (user && user.role !== 'customer') {
			return fail(res, 409, 'An account with this email already exists.', 'EMAIL_TAKEN');
		}

		if (user) {
			// Unverified sign-up being retried: refresh details, send a new code
			user.name = cleanName;
			user.phone = cleanPhone;
			user.password = password;
		} else {
			user = new User({
				name: cleanName,
				email: cleanEmail,
				phone: cleanPhone,
				password,
				role: 'customer',
				emailVerified: verificationRequired ? false : true
			});
		}
		await user.save();

		if (!verificationRequired) {
			return signIn(res, req, user, { status: 201 });
		}

		await issueVerificationCode(user);
		return res.status(201).json({ status: 'VERIFICATION_REQUIRED', email: user.email, codeTtlMinutes: CODE_TTL_MIN });
	} catch (err) {
		if (err instanceof MailNotConfiguredError) {
			return fail(res, 503, 'We could not send the verification email. Please try again later.', 'MAIL_UNAVAILABLE');
		}
		if (err?.code === 11000) {
			return fail(res, 409, 'An account with this email already exists. Please sign in.', 'EMAIL_TAKEN');
		}
		console.error('Registration error:', err);
		return fail(res, 500, 'Registration failed');
	}
}

export async function verifyEmail(req, res) {
	try {
		const email = normalizeEmail(req.body?.email);
		const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
		if (!email || !/^\d{6}$/.test(code)) return fail(res, 400, 'Enter the 6-digit code from your email', 'INVALID_CODE');

		const user = await User.findOne({ email, role: 'customer' }).select(
			'+emailVerification.codeHash +emailVerification.expiresAt +emailVerification.attempts'
		);
		if (!user) return fail(res, 400, 'Invalid or expired code', 'INVALID_CODE');
		if (user.emailVerified !== false) return fail(res, 400, 'This email is already verified. Please sign in.', 'ALREADY_VERIFIED');

		const ev = user.emailVerification || {};
		if (!ev.codeHash || !ev.expiresAt || ev.expiresAt <= new Date()) {
			return fail(res, 400, 'This code has expired. Request a new one.', 'CODE_EXPIRED');
		}
		if ((ev.attempts || 0) >= MAX_CODE_ATTEMPTS) {
			return fail(res, 429, 'Too many incorrect attempts. Request a new code.', 'TOO_MANY_ATTEMPTS');
		}
		if (!safeEqualHex(sha256(code), ev.codeHash)) {
			user.emailVerification.attempts = (ev.attempts || 0) + 1;
			await user.save();
			return fail(res, 400, 'Invalid or expired code', 'INVALID_CODE');
		}

		user.emailVerified = true;
		user.emailVerification = undefined;
		return signIn(res, req, user);
	} catch (err) {
		console.error('Verify email error:', err);
		return fail(res, 500, 'Verification failed');
	}
}

export async function resendVerification(req, res) {
	const generic = { message: 'If this email is awaiting verification, a new code has been sent.' };
	try {
		const email = normalizeEmail(req.body?.email);
		if (!email) return res.json(generic);
		const user = await User.findOne({ email, role: 'customer' }).select('+emailVerification.lastSentAt');
		if (!user || user.emailVerified !== false) return res.json(generic);
		const last = user.emailVerification?.lastSentAt;
		if (last && Date.now() - last.getTime() < RESEND_COOLDOWN_MS) {
			return fail(res, 429, 'Please wait a minute before requesting another code.', 'RESEND_COOLDOWN');
		}
		await issueVerificationCode(user);
		return res.json(generic);
	} catch (err) {
		if (err instanceof MailNotConfiguredError) {
			return fail(res, 503, 'We could not send the email. Please try again later.', 'MAIL_UNAVAILABLE');
		}
		console.error('Resend verification error:', err);
		return fail(res, 500, 'Could not send a new code');
	}
}

export async function login(req, res) {
	try {
		const email = normalizeEmail(req.body?.email);
		const password = req.body?.password;
		const remember = req.body?.remember === true;
		if (!email || !isNonEmptyString(password, 128)) {
			return fail(res, 400, 'Invalid email or password', 'INVALID_CREDENTIALS');
		}

		const user = await User.findOne({ email }).select('+password +failedLoginAttempts +lockUntil');
		if (!user) {
			await bcrypt.compare(password, DUMMY_HASH);
			return fail(res, 401, 'Invalid email or password', 'INVALID_CREDENTIALS');
		}

		if (user.isLocked()) {
			const minutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
			return fail(res, 423, `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`, 'ACCOUNT_LOCKED');
		}

		const ok = await user.comparePassword(password);
		if (!ok) {
			user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
			if (user.failedLoginAttempts >= MAX_FAILED_LOGINS) {
				user.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
				user.failedLoginAttempts = 0;
			}
			await user.save();
			return fail(res, 401, 'Invalid email or password', 'INVALID_CREDENTIALS');
		}

		user.failedLoginAttempts = 0;
		user.lockUntil = undefined;

		// Only reveal account state after the password has been proven
		if (!user.isActive) {
			await user.save();
			return fail(res, 403, 'This account has been disabled. Please contact support.', 'ACCOUNT_DISABLED');
		}
		if (user.emailVerified === false) {
			await user.save();
			return fail(res, 403, 'Please verify your email address to continue.', 'EMAIL_NOT_VERIFIED');
		}

		return signIn(res, req, user, { persistent: remember });
	} catch (err) {
		console.error('Login error:', err);
		return fail(res, 500, 'Login failed');
	}
}

export async function refresh(req, res) {
	try {
		const result = await rotateSession(res, req);
		if (result.error) {
			// A racing tab already rotated this cookie; keep the newer cookie intact
			if (result.error !== 'REFRESH_RACE') clearRefreshCookie(res);
			return fail(res, 401, 'Session expired. Please sign in again.', result.error);
		}
		const user = await User.findById(result.userId);
		if (!user || !user.isActive || user.emailVerified === false) {
			await endSession(req);
			clearRefreshCookie(res);
			return fail(res, 401, 'Session expired. Please sign in again.', 'NO_SESSION');
		}
		return res.json({ user: user.toPublic(), accessToken: signAccessToken(user) });
	} catch (err) {
		console.error('Refresh error:', err);
		return fail(res, 500, 'Could not refresh session');
	}
}

export async function logout(req, res) {
	try {
		await endSession(req);
	} catch (err) {
		console.error('Logout error:', err);
	}
	clearRefreshCookie(res);
	return res.status(204).end();
}

export async function forgotPassword(req, res) {
	const generic = { message: 'If an account exists for this email, a password reset link has been sent.' };
	try {
		const email = normalizeEmail(req.body?.email);
		if (!email) return res.json(generic);
		const user = await User.findOne({ email }).select('+passwordReset.requestedAt');
		if (!user || !user.isActive) return res.json(generic);

		const last = user.passwordReset?.requestedAt;
		if (last && Date.now() - last.getTime() < RESEND_COOLDOWN_MS) return res.json(generic);

		const token = randomToken(32);
		user.passwordReset = {
			tokenHash: sha256(token),
			expiresAt: new Date(Date.now() + RESET_TTL_MIN * 60 * 1000),
			requestedAt: new Date()
		};
		await user.save();
		await sendPasswordResetEmail({
			to: user.email,
			name: user.name,
			link: `${appUrl()}/reset-password?token=${token}`,
			minutes: RESET_TTL_MIN
		});
		return res.json(generic);
	} catch (err) {
		if (err instanceof MailNotConfiguredError) {
			return fail(res, 503, 'We could not send the email. Please try again later.', 'MAIL_UNAVAILABLE');
		}
		console.error('Forgot password error:', err);
		return res.json(generic);
	}
}

export async function resetPassword(req, res) {
	try {
		const token = req.body?.token;
		const password = req.body?.password;
		if (!isNonEmptyString(token, 200)) return fail(res, 400, 'This link is invalid or has expired', 'INVALID_TOKEN');
		const pwError = passwordPolicyError(password);
		if (pwError) return fail(res, 400, pwError, 'WEAK_PASSWORD');

		const user = await User.findOne({
			'passwordReset.tokenHash': sha256(token),
			'passwordReset.expiresAt': { $gt: new Date() }
		});
		if (!user || !user.isActive) return fail(res, 400, 'This link is invalid or has expired', 'INVALID_TOKEN');

		user.password = password;
		user.passwordReset = undefined;
		user.failedLoginAttempts = 0;
		user.lockUntil = undefined;
		// Receiving the link proves ownership of the mailbox (also activates agent invites)
		user.emailVerified = true;
		user.tokenVersion = (user.tokenVersion || 0) + 1;
		await user.save();
		await revokeAllSessions(user._id);

		return res.json({ message: 'Your password has been set. You can now sign in.' });
	} catch (err) {
		console.error('Reset password error:', err);
		return fail(res, 500, 'Could not reset password');
	}
}
