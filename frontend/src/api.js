import axios from 'axios';

// if (import.meta.env.DEV) {
//   // code inside here will be tree-shaken in production builds
//   console.log('Dev mode')
// }
const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE, withCredentials: false });

api.interceptors.request.use((config) => {
	const token = localStorage.getItem('token');
	if (token) config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
	return config;
});

export async function apiFetch(path, options = {}) {
	try {
		const method = (options.method || 'GET').toLowerCase();
		const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
		const data = options.body ?? undefined;
		const res = await api.request({ url: path, method, headers, data });
		return res.data;
	} catch (error) {
		if (error.response) {
			// Server responded with error
			const message = error.response.data?.message || error.response.data?.error || 'Request failed';
			throw new Error(message);
		} else if (error.request) {
			// Request made but no response
			throw new Error('No response from server. Please check your connection.');
		} else {
			// Something else happened
			throw new Error(error.message || 'An error occurred');
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
