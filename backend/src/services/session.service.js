import { Session } from '../models/Session.js';
import { randomToken, sha256 } from '../utils/tokens.js';

export const REFRESH_COOKIE = 'scpms_rt';

const DAY_MS = 24 * 60 * 60 * 1000;
const PERSISTENT_TTL_MS = 30 * DAY_MS; // "Remember me"
const SESSION_TTL_MS = 1 * DAY_MS;
// Concurrent refreshes (e.g. two tabs on page load) may present the same token
// moments apart; within this window a reused token is not treated as theft.
const ROTATION_GRACE_MS = 30 * 1000;

const isProduction = process.env.NODE_ENV === 'production';
// "lax" when the frontend reaches the API through a same-site proxy (recommended);
// "none" only if the browser calls the API on a different site directly.
const SAME_SITE = (process.env.COOKIE_SAMESITE || 'lax').toLowerCase();
const SECURE = SAME_SITE === 'none' || process.env.COOKIE_SECURE === 'true' || isProduction;

function cookieOptions(persistent, expiresAt) {
	return {
		httpOnly: true,
		secure: SECURE,
		sameSite: SAME_SITE,
		path: '/api/auth',
		...(persistent ? { expires: expiresAt } : {})
	};
}

export function clearRefreshCookie(res) {
	res.clearCookie(REFRESH_COOKIE, { ...cookieOptions(false), expires: undefined });
}

function clientMeta(req) {
	return {
		userAgent: String(req.get('user-agent') || '').slice(0, 300),
		ip: String(req.ip || '').slice(0, 64)
	};
}

async function issue(res, req, { userId, family, persistent }) {
	const token = randomToken();
	const expiresAt = new Date(Date.now() + (persistent ? PERSISTENT_TTL_MS : SESSION_TTL_MS));
	await Session.create({
		user: userId,
		tokenHash: sha256(token),
		family,
		expiresAt,
		persistent,
		...clientMeta(req)
	});
	res.cookie(REFRESH_COOKIE, token, cookieOptions(persistent, expiresAt));
}

export async function startSession(res, req, user, { persistent = false } = {}) {
	await issue(res, req, { userId: user._id, family: randomToken(16), persistent });
}

// Returns { userId } on success, or { error } with a machine-readable code
export async function rotateSession(res, req) {
	const token = req.cookies?.[REFRESH_COOKIE];
	if (!token || typeof token !== 'string') return { error: 'NO_SESSION' };

	const session = await Session.findOne({ tokenHash: sha256(token) });
	if (!session || session.expiresAt <= new Date()) return { error: 'NO_SESSION' };

	if (session.revokedAt) return { error: 'NO_SESSION' };

	if (session.rotatedAt) {
		if (Date.now() - session.rotatedAt.getTime() < ROTATION_GRACE_MS) {
			return { error: 'REFRESH_RACE' };
		}
		// An old token came back long after rotation: assume it was stolen
		await Session.updateMany({ family: session.family, revokedAt: null }, { revokedAt: new Date() });
		return { error: 'TOKEN_REUSE' };
	}

	session.rotatedAt = new Date();
	await session.save();
	await issue(res, req, { userId: session.user, family: session.family, persistent: session.persistent });
	return { userId: session.user };
}

export async function endSession(req) {
	const token = req.cookies?.[REFRESH_COOKIE];
	if (!token || typeof token !== 'string') return;
	const session = await Session.findOne({ tokenHash: sha256(token) });
	if (session) {
		await Session.updateMany({ family: session.family, revokedAt: null }, { revokedAt: new Date() });
	}
}

export async function revokeAllSessions(userId) {
	await Session.updateMany({ user: userId, revokedAt: null }, { revokedAt: new Date() });
}
