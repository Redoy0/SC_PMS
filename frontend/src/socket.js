import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

console.log('🔌 Socket.IO URL:', SOCKET_URL);
console.log('🔌 VITE_SOCKET_URL env:', import.meta.env.VITE_SOCKET_URL);
console.log('🔌 All env vars:', import.meta.env);

// Create a default socket instance for general use
export const socket = io(SOCKET_URL, {
	reconnection: true,
	reconnectionDelay: 1000,
	reconnectionAttempts: 5
});

socket.on('connect', () => {
	console.log('✅ Default socket connected:', socket.id);
});

socket.on('connect_error', (error) => {
	console.error('❌ Default socket error:', error.message);
});

// Export the createSocket function for creating user-specific sockets
export function createSocket(userId) {
	console.log('Creating socket for userId:', userId, 'URL:', SOCKET_URL);
	const socketInstance = io(SOCKET_URL, { 
		query: { userId },
		reconnection: true,
		reconnectionDelay: 1000,
		reconnectionAttempts: 5
	});
	
	socketInstance.on('connect', () => {
		console.log('✅ Socket connected:', socketInstance.id, 'for user:', userId);
	});
	
	socketInstance.on('connect_error', (error) => {
		console.error('❌ Socket connection error:', error.message, error);
	});
	
	socketInstance.on('disconnect', (reason) => {
		console.log('🔴 Socket disconnected:', reason);
	});
	
	return socketInstance;
}
