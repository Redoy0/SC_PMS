import crypto from 'crypto';

export function randomToken(bytes = 48) {
	return crypto.randomBytes(bytes).toString('base64url');
}

export function sha256(value) {
	return crypto.createHash('sha256').update(String(value)).digest('hex');
}

// Six-digit numeric one-time code, uniformly distributed
export function numericCode(digits = 6) {
	return String(crypto.randomInt(0, 10 ** digits)).padStart(digits, '0');
}

// Constant-time comparison of two hex digests
export function safeEqualHex(a, b) {
	if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
	return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

// No 0/O/1/I to avoid misreads when codes are typed in by hand
const TRACKING_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// 10 characters from a 32-symbol alphabet = 50 bits, far beyond what a
// rate-limited public endpoint can enumerate
export function trackingCode(length = 10) {
	let code = '';
	for (let i = 0; i < length; i++) {
		code += TRACKING_ALPHABET[crypto.randomInt(0, TRACKING_ALPHABET.length)];
	}
	return code;
}
