import { verifyJwt } from '../utils/jwt.js';
import { User } from '../models/User.js';

export async function requireAuth(req, res, next) {
	try {
		const authHeader = req.headers.authorization || '';
		const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
		if (!token) return res.status(401).json({ message: 'Unauthorized', code: 'NO_TOKEN' });
		const decoded = verifyJwt(token);
		const user = await User.findById(decoded.id);
		// tokenVersion mismatch means the password was changed or the account was disabled
		if (!user || !user.isActive || (decoded.tv ?? 0) !== (user.tokenVersion ?? 0)) {
			return res.status(401).json({ message: 'Unauthorized', code: 'TOKEN_REVOKED' });
		}
		req.user = { id: user.id, role: user.role, name: user.name };
		next();
	} catch (err) {
		const code = err?.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
		return res.status(401).json({ message: 'Unauthorized', code });
	}
}

export function requireRoles(...roles) {
	return function (req, res, next) {
		if (!req.user || !roles.includes(req.user.role)) {
			return res.status(403).json({ message: 'Forbidden' });
		}
		next();
	};
}

export function requireXhr(req, res, next) {
	if (req.get('x-requested-with') !== 'XMLHttpRequest') {
		return res.status(403).json({ message: 'Forbidden', code: 'CSRF_CHECK_FAILED' });
	}
	next();
}
