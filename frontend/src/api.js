import axios from 'axios';

// Same-origin by default: Vite (dev) and Vercel/Netlify (prod) proxy /api to the
// backend, which keeps the httpOnly refresh cookie first-party.
const API_BASE = import.meta.env.VITE_API_BASE || '/api';

// The access token lives only in memory (never localStorage), so a script
// injected into the page cannot read a long-lived credential from storage.
let accessToken = null;
let onSessionLost = null;

export function getAccessToken() {
	return accessToken;
}

export function setAccessToken(token) {
	accessToken = token || null;
}

// AuthContext registers this so the UI can sign out when refresh fails
export function setSessionLostHandler(handler) {
	onSessionLost = handler;
}

const api = axios.create({
	baseURL: API_BASE,
	withCredentials: true,
	// Required by the backend on cookie-authenticated endpoints (CSRF defence)
	headers: { 'X-Requested-With': 'XMLHttpRequest' }
});

api.interceptors.request.use((config) => {
	if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
	return config;
});

let refreshPromise = null;

async function requestRefresh(retryOnRace = true) {
	try {
		const { data } = await axios.post(`${API_BASE}/auth/refresh`, null, {
			withCredentials: true,
			headers: { 'X-Requested-With': 'XMLHttpRequest' }
		});
		setAccessToken(data.accessToken);
		return data;
	} catch (error) {
		// Another tab rotated the cookie a moment ago; the browser now holds the new one
		if (retryOnRace && error.response?.data?.code === 'REFRESH_RACE') {
			await new Promise(r => setTimeout(r, 400));
			return requestRefresh(false);
		}
		setAccessToken(null);
		throw error;
	}
}

// Single-flight: concurrent 401s share one refresh request
export function refreshSession() {
	if (!refreshPromise) {
		refreshPromise = requestRefresh().finally(() => { refreshPromise = null; });
	}
	return refreshPromise;
}

const RETRYABLE_CODES = ['TOKEN_EXPIRED', 'INVALID_TOKEN', 'TOKEN_REVOKED', 'NO_TOKEN'];

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const original = error.config;
		const status = error.response?.status;
		const code = error.response?.data?.code;
		const isAuthCall = original?.url?.startsWith('/auth/');
		if (status === 401 && !isAuthCall && original && !original._retried && RETRYABLE_CODES.includes(code)) {
			original._retried = true;
			try {
				await refreshSession();
				return api.request(original);
			} catch {
				onSessionLost?.();
			}
		}
		return Promise.reject(error);
	}
);

// Error carrying the server's machine-readable code (e.g. EMAIL_NOT_VERIFIED)
export class ApiError extends Error {
	constructor(message, { status, code, data } = {}) {
		super(message);
		this.status = status;
		this.code = code;
		this.data = data;
	}
}

export async function apiFetch(path, options = {}) {
	try {
		const method = (options.method || 'GET').toLowerCase();
		const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
		const data = options.body ?? undefined;
		const res = await api.request({ url: path, method, headers, data });
		return res.data;
	} catch (error) {
		if (error.response) {
			const body = error.response.data || {};
			const message = body.message || body.error || 'Request failed';
			throw new ApiError(message, { status: error.response.status, code: body.code, data: body });
		} else if (error.request) {
			throw new ApiError('No response from server. Please check your connection.');
		} else {
			throw new ApiError(error.message || 'An error occurred');
		}
	}
}

export async function apiFetchBlob(path, options = {}) {
	const method = (options.method || 'GET').toLowerCase();
	const headers = { ...(options.headers || {}) };
	const data = options.body ?? undefined;
	const res = await api.request({ url: path, method, headers, data, responseType: 'blob' });
	return res.data;
}

export { api };
