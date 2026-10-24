// Socket.IO rooms used across the app:
//   role:admin      every signed-in admin
//   user:<id>       every socket of one signed-in user
//   parcel:<id>     anyone watching one parcel (owner, assigned agent, admin,
//                   or a public viewer who proved they know the tracking code)
let io = null;

export function setIo(instance) {
	io = instance;
}

export function getIo() {
	return io;
}

const idOf = (ref) => (ref ? String(ref._id ?? ref) : null);

// Parcel watchers: admins, the owning customer, the assigned agent and the parcel room
export function parcelRooms(parcel) {
	const rooms = ['role:admin', `parcel:${idOf(parcel)}`];
	const customerId = idOf(parcel.customer);
	const agentId = idOf(parcel.agent);
	if (customerId) rooms.push(`user:${customerId}`);
	if (agentId) rooms.push(`user:${agentId}`);
	return rooms;
}

// Only what a public tracking viewer may see about the agent
export function publicAgent(agent) {
	if (!agent || typeof agent !== 'object' || !agent.name) return agent ? { _id: idOf(agent) } : null;
	return { _id: idOf(agent), name: agent.name };
}

export function emitToParcel(parcel, event, payload) {
	if (!io) return;
	io.to(parcelRooms(parcel)).emit(event, payload);
}

export function emitToAdmins(event, payload) {
	if (!io) return;
	io.to('role:admin').emit(event, payload);
}
