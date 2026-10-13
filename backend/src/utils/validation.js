import mongoose from 'mongoose';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Bangladeshi mobile numbers: 01XXXXXXXXX, optionally prefixed with +88 / 88
const BD_PHONE_RE = /^(?:\+?88)?(01[3-9]\d{8})$/;

export const PASSWORD_MIN = 8;
// bcrypt only uses the first 72 bytes, so cap input length well below that
export const PASSWORD_MAX = 64;

export function isNonEmptyString(value, max = 500) {
	return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}

export function normalizeEmail(value) {
	if (typeof value !== 'string') return null;
	const email = value.trim().toLowerCase();
	return email.length <= 254 && EMAIL_RE.test(email) ? email : null;
}

// Returns the canonical 11-digit local form (01XXXXXXXXX) or null
export function normalizePhone(value) {
	if (typeof value !== 'string') return null;
	const match = value.replace(/[\s-]/g, '').match(BD_PHONE_RE);
	return match ? match[1] : null;
}

export function normalizeName(value) {
	if (typeof value !== 'string') return null;
	const name = value.trim().replace(/\s+/g, ' ');
	return name.length >= 2 && name.length <= 80 ? name : null;
}

// Returns an error message, or null if the password satisfies the policy
export function passwordPolicyError(password) {
	if (typeof password !== 'string') return 'Password is required';
	if (password.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters`;
	if (password.length > PASSWORD_MAX) return `Password must be at most ${PASSWORD_MAX} characters`;
	if (!/[a-z]/i.test(password) || !/\d/.test(password)) {
		return 'Password must contain both letters and numbers';
	}
	return null;
}

export function isObjectId(value) {
	return typeof value === 'string' && mongoose.isValidObjectId(value);
}

export function isValidLatLng(lat, lng) {
	return (
		typeof lat === 'number' && typeof lng === 'number' &&
		Number.isFinite(lat) && Number.isFinite(lng) &&
		lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
	);
}
