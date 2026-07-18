export function registerSocketHandlers(io) {
	io.on('connection', socket => {
		const userId = socket.handshake.query.userId;
		console.log('✅ Socket.IO client connected:', socket.id, 'userId:', userId);
		
		if (userId) {
			socket.join(`user:${userId}`);
		}
		
		socket.on('subscribe:parcel', parcelId => {
			if (parcelId) socket.join(`parcel:${parcelId}`);
		});
		
		socket.on('unsubscribe:parcel', parcelId => {
			if (parcelId) socket.leave(`parcel:${parcelId}`);
		});
		
		// Handle agent location updates
		socket.on('agent:location:update', (data) => {
			const { agentId, location, timestamp } = data;
			
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
