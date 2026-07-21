import { verifyJwt } from '../utils/jwt.js';

export function registerSocketHandlers(io) {
	io.on('connection', socket => {
		// Public/anonymous connections are allowed (e.g. public parcel tracking),
		// but a valid token is required to join a private user room or push
		// authenticated agent location updates.
		const token = socket.handshake.auth?.token;
		if (token) {
			try {
				const decoded = verifyJwt(token);
				socket.data.user = { id: String(decoded.id), role: decoded.role };
				socket.join(`user:${socket.data.user.id}`);
			} catch (_) {
				// invalid/expired token: treat as anonymous rather than dropping the connection
			}
		}
		console.log('✅ Socket.IO client connected:', socket.id, 'user:', socket.data.user?.id || 'anonymous');

		socket.on('subscribe:parcel', parcelId => {
			if (parcelId) socket.join(`parcel:${parcelId}`);
		});
		
		socket.on('unsubscribe:parcel', parcelId => {
			if (parcelId) socket.leave(`parcel:${parcelId}`);
		});
		
		// Handle agent location updates
		socket.on('agent:location:update', (data) => {
			const { agentId, location, timestamp } = data;

			// Only the authenticated agent may publish their own location.
			const user = socket.data.user;
			if (!user || user.role !== 'agent' || String(agentId) !== user.id) {
				return;
			}

			// Store the latest location in memory (you could also store in Redis/DB)
			if (!io.agentLocations) {
				io.agentLocations = new Map();
			}
			io.agentLocations.set(agentId, { location, timestamp });
			
			// Emit location update to all clients
			io.emit('agent:location:update', {
				agentId,
				location,
				timestamp
			});
		});
		
		// Handle request for current agent location
		socket.on('request:agent:location', (data) => {
			const { agentId } = data;
			
			// Check if we have stored location
			if (io.agentLocations && io.agentLocations.has(agentId)) {
				const locationData = io.agentLocations.get(agentId);
				socket.emit('agent:location:update', {
					agentId,
					location: locationData.location,
					timestamp: locationData.timestamp
				});
			}
			
			// Also broadcast request to the agent to send fresh location
			io.emit('request:agent:location', { agentId });
		});
		
		socket.on('disconnect', () => {
			console.log('❌ Socket.IO client disconnected:', socket.id);
		});
	});
}
