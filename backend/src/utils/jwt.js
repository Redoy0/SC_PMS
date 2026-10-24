import jwt from 'jsonwebtoken';

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
	throw new Error('JWT_SECRET must be set to a random string of at least 32 characters in production');
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
// Short-lived: the long-lived credential is the httpOnly refresh cookie
export const ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_EXPIRES || '15m';
const ISSUER = 'scpms-api';

// tv = the user's tokenVersion; bumping it revokes every outstanding access token
export function signAccessToken(user) {
	return jwt.sign(
		{ id: String(user._id ?? user.id), role: user.role, tv: user.tokenVersion ?? 0 },
		JWT_SECRET,
		{ expiresIn: ACCESS_TOKEN_TTL, issuer: ISSUER, algorithm: 'HS256' }
	);
}

export function verifyJwt(token) {
	return jwt.verify(token, JWT_SECRET, { issuer: ISSUER, algorithms: ['HS256'] });
}
