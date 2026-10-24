import { io } from 'socket.io-client';
import { getAccessToken } from './api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// The token is read on every (re)connect, so sockets always use the latest
// in-memory access token. Without one, the socket is anonymous and can only
// follow parcels it proves it knows the tracking code for.
const authFromMemory = (cb) => cb({ token: getAccessToken() || undefined });

// Shared socket for public pages and general use
export const socket = io(SOCKET_URL, {
	auth: authFromMemory,
	reconnection: true,
	reconnectionDelay: 1000,
	reconnectionAttempts: 5
});

// Re-handshake after sign-in/sign-out so the server re-evaluates identity
export function reconnectSocket() {
	if (socket.connected) socket.disconnect();
	socket.connect();
}

// Dedicated socket for a page; identity comes from the access token, the
// label is only used for local debugging
export function createSocket(label) {
	const socketInstance = io(SOCKET_URL, {
		auth: authFromMemory,
		reconnection: true,
		reconnectionDelay: 1000,
		reconnectionAttempts: 5
	});

	socketInstance.on('connect_error', (error) => {
		console.error('Socket connection error:', label, error.message);
	});

	return socketInstance;
}
