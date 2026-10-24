import { verifyJwt } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { Parcel, ACTIVE_STATUSES } from '../models/Parcel.js';
import { isObjectId, isValidLatLng } from '../utils/validation.js';

const MAX_PARCEL_SUBSCRIPTIONS = 25;
const ACTIVE_PARCELS_CACHE_MS = 15 * 1000;

// agentId -> { at, rooms } so a moving agent does not hit the database on every GPS tick
const agentRoomCache = new Map();
// agentId -> { location, timestamp }
const agentLocations = new Map();

async function roomsForAgentLocation(agentId) {
	const cached = agentRoomCache.get(agentId);
	if (cached && Date.now() - cached.at < ACTIVE_PARCELS_CACHE_MS) return cached.rooms;

	const parcels = await Parcel.find({ agent: agentId, status: { $in: ACTIVE_STATUSES } })
		.select('_id customer')
		.lean();
	const rooms = new Set(['role:admin']);
	for (const p of parcels) {
		rooms.add(`parcel:${p._id}`);
		if (p.customer) rooms.add(`user:${p.customer}`);
	}
	const result = [...rooms];
	agentRoomCache.set(agentId, { at: Date.now(), rooms: result });
	return result;
}

export function invalidateAgentRooms(agentId) {
	if (agentId) agentRoomCache.delete(String(agentId));
}

async function authenticate(socket) {
	const token = socket.handshake.auth?.token;
	if (!token || typeof token !== 'string') return null;
	try {
		const decoded = verifyJwt(token);
		const user = await User.findById(decoded.id).select('role isActive tokenVersion').lean();
		if (!user || !user.isActive || (decoded.tv ?? 0) !== (user.tokenVersion ?? 0)) return null;
		return { id: String(user._id), role: user.role };
	} catch {
		// Invalid/expired token: continue as an anonymous (public tracking) socket
		return null;
	}
}

async function canWatchParcel(user, parcelId, trackingCode) {
	const parcel = await Parcel.findById(parcelId).select('customer agent trackingCode').lean();
	if (!parcel) return false;
	if (typeof trackingCode === 'string' && trackingCode === parcel.trackingCode) return true;
	if (!user) return false;
	if (user.role === 'admin') return true;
	return String(parcel.customer) === user.id || String(parcel.agent) === user.id;
}

export function registerSocketHandlers(io) {
	io.use(async (socket, next) => {
		socket.data.user = await authenticate(socket);
		next();
	});

	io.on('connection', socket => {
		const user = socket.data.user;
		if (user) {
			socket.join(`user:${user.id}`);
			if (user.role === 'admin') socket.join('role:admin');
		}

		// Accepts { parcelId, trackingCode } (public viewers) or a bare parcelId (signed-in users)
		socket.on('subscribe:parcel', async (payload) => {
			try {
				const parcelId = typeof payload === 'string' ? payload : payload?.parcelId;
				const trackingCode = typeof payload === 'object' ? payload?.trackingCode : undefined;
				if (!isObjectId(parcelId)) return;
				const joined = [...socket.rooms].filter(r => r.startsWith('parcel:')).length;
				if (joined >= MAX_PARCEL_SUBSCRIPTIONS) return;
				if (await canWatchParcel(user, parcelId, trackingCode)) socket.join(`parcel:${parcelId}`);
			} catch (err) {
				console.error('subscribe:parcel failed:', err?.message || err);
			}
		});

		socket.on('unsubscribe:parcel', (payload) => {
			const parcelId = typeof payload === 'string' ? payload : payload?.parcelId;
			if (isObjectId(parcelId)) socket.leave(`parcel:${parcelId}`);
		});

		// Only the authenticated agent may publish their own location, and it is
		// delivered only to admins and to people watching that agent's active parcels.
		socket.on('agent:location:update', async (data) => {
			try {
				if (!user || user.role !== 'agent' || String(data?.agentId) !== user.id) return;
				const lat = Number(data?.location?.lat);
				const lng = Number(data?.location?.lng);
				if (!isValidLatLng(lat, lng)) return;

				const location = { lat, lng };
				const timestamp = new Date().toISOString();
				agentLocations.set(user.id, { location, timestamp });

				const rooms = await roomsForAgentLocation(user.id);
				io.to(rooms).emit('agent:location:update', { agentId: user.id, location, timestamp });
			} catch (err) {
				console.error('agent:location:update failed:', err?.message || err);
			}
		});

		// Admin asks for an agent's position: reply with the last known fix and
		// ask that agent (only) to send a fresh one.
		socket.on('request:agent:location', (data) => {
			if (!user || user.role !== 'admin') return;
			const agentId = String(data?.agentId || '');
			if (!isObjectId(agentId)) return;
			const last = agentLocations.get(agentId);
			if (last) socket.emit('agent:location:update', { agentId, ...last });
			io.to(`user:${agentId}`).emit('request:agent:location', { agentId });
		});
	});
}
