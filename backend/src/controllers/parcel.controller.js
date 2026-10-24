import {
	Parcel, PARCEL_STATUSES, PARCEL_SIZES, PARCEL_TYPES, PAYMENT_TYPES,
	ACTIVE_STATUSES, FINAL_STATUSES, MAX_COD_AMOUNT
} from '../models/Parcel.js';
import { User } from '../models/User.js';
import { sendStatusEmail } from '../utils/mailer.js';
import { trackingCode as newTrackingCode } from '../utils/tokens.js';
import { isNonEmptyString, isObjectId, isValidLatLng } from '../utils/validation.js';
import { emitToAdmins, emitToParcel, publicAgent } from '../services/realtime.js';
import { invalidateAgentRooms } from '../services/socket.js';

const TRACKING_CODE_RE = /^[A-Z0-9]{6,16}$/;

function badId(res) {
	return res.status(400).json({ message: 'Invalid parcel id' });
}

// What anyone holding the tracking code may see: no customer identity,
// contact details or internal notes
function toPublicParcel(p) {
	return {
		_id: p._id,
		trackingCode: p.trackingCode,
		status: p.status,
		pickupAddress: p.pickupAddress,
		deliveryAddress: p.deliveryAddress,
		parcelSize: p.parcelSize,
		parcelType: p.parcelType,
		paymentType: p.paymentType,
		codAmount: p.codAmount,
		currentLocation: p.currentLocation,
		etaMinutes: p.etaMinutes,
		agent: publicAgent(p.agent),
		statusHistory: (p.statusHistory || []).map(e => ({ status: e.status, at: e.at })),
		createdAt: p.createdAt,
		updatedAt: p.updatedAt
	};
}

// Agents can only move a parcel forward along the lifecycle (or mark it
// failed while it is active). Finished parcels are locked for everyone.
function transitionError(role, from, to) {
	if (from === to) return `Parcel is already ${to}`;
	if (FINAL_STATUSES.includes(from)) return `Parcel is already ${from} and can no longer change`;
	if (role === 'admin') return null;
	if (!ACTIVE_STATUSES.includes(from)) return 'Parcel has not been assigned yet';
	if (to === 'Failed') return null;
	const order = PARCEL_STATUSES.indexOf(to) - PARCEL_STATUSES.indexOf(from);
	if (order <= 0 || to === 'Assigned' || to === 'Pending') return `Cannot change status from ${from} to ${to}`;
	return null;
}

export async function createParcel(req, res) {
	try {
		const { pickupAddress, deliveryAddress, parcelSize, parcelType, paymentType, codAmount, notes } = req.body || {};

		if (!isNonEmptyString(pickupAddress, 300) || !isNonEmptyString(deliveryAddress, 300)) {
			return res.status(400).json({ message: 'Pickup and delivery addresses are required (max 300 characters)' });
		}
		if (!PARCEL_SIZES.includes(parcelSize)) {
			return res.status(400).json({ message: `parcelSize must be one of: ${PARCEL_SIZES.join(', ')}` });
		}
		if (!PARCEL_TYPES.includes(parcelType)) {
			return res.status(400).json({ message: `parcelType must be one of: ${PARCEL_TYPES.join(', ')}` });
		}
		if (!PAYMENT_TYPES.includes(paymentType)) {
			return res.status(400).json({ message: `paymentType must be one of: ${PAYMENT_TYPES.join(', ')}` });
		}
		let cod = 0;
		if (paymentType === 'COD') {
			cod = Number(codAmount ?? 0);
			if (!Number.isFinite(cod) || cod < 0 || cod > MAX_COD_AMOUNT) {
				return res.status(400).json({ message: `COD amount must be between 0 and ${MAX_COD_AMOUNT}` });
			}
		}
		if (notes != null && (typeof notes !== 'string' || notes.length > 500)) {
			return res.status(400).json({ message: 'Notes must be text of at most 500 characters' });
		}

		let parcel;
		// Retry on the (astronomically unlikely) chance of a tracking code collision
		for (let attempt = 0; attempt < 3 && !parcel; attempt++) {
			try {
				parcel = await Parcel.create({
					trackingCode: newTrackingCode(),
					customer: req.user.id,
					pickupAddress: pickupAddress.trim(),
					deliveryAddress: deliveryAddress.trim(),
					parcelSize,
					parcelType,
					paymentType,
					codAmount: cod,
					notes: notes?.trim() || undefined,
					statusHistory: [{ status: 'Pending', by: req.user.id, role: req.user.role }]
				});
			} catch (err) {
				if (err?.code !== 11000 || !err?.keyPattern?.trackingCode) throw err;
			}
		}
		if (!parcel) throw new Error('Could not allocate a tracking code');

		await parcel.populate('customer', 'name email phone');
		emitToAdmins('parcel:created', parcel.toObject());
		res.status(201).json(parcel);
	} catch (err) {
		console.error('Create parcel error:', err);
		res.status(500).json({ message: 'Create parcel failed' });
	}
}

export async function listParcels(req, res) {
	try {
		const { role, id: userId } = req.user;
		const filter = {};
		if (role === 'admin') {
			if (req.query.agent) {
				if (!isObjectId(req.query.agent)) return res.status(400).json({ message: 'Invalid agent id' });
				filter.agent = req.query.agent;
			}
		} else if (role === 'customer') {
			filter.customer = userId;
		} else if (role === 'agent') {
			filter.agent = userId;
		}

		const parcels = await Parcel.find(filter)
			.sort({ createdAt: -1 })
			.populate('customer', 'name email phone')
			.populate('agent', 'name email phone');
		res.json(parcels);
	} catch (err) {
		console.error('List parcels error:', err);
		res.status(500).json({ message: 'Fetch parcels failed' });
	}
}

export async function getParcel(req, res) {
	try {
		if (!isObjectId(req.params.id)) return badId(res);
		const parcel = await Parcel.findById(req.params.id)
			.populate('customer', 'name email phone')
			.populate('agent', 'name email phone');
		if (!parcel) return res.status(404).json({ message: 'Not found' });

		const { role, id: userId } = req.user;
		const isOwner = role === 'customer' && String(parcel.customer?._id ?? parcel.customer) === String(userId);
		const isAssignedAgent = role === 'agent' && String(parcel.agent?._id ?? parcel.agent) === String(userId);
		if (role !== 'admin' && !isOwner && !isAssignedAgent) {
			return res.status(403).json({ message: 'Forbidden' });
		}

		res.json(parcel);
	} catch (err) {
		console.error('Get parcel error:', err);
		res.status(500).json({ message: 'Fetch parcel failed' });
	}
}

export async function getParcelByTrackingCode(req, res) {
	try {
		const code = String(req.params.trackingCode || '').trim().toUpperCase();
		if (!TRACKING_CODE_RE.test(code)) return res.status(404).json({ message: 'Parcel not found' });
		const parcel = await Parcel.findOne({ trackingCode: code }).populate('agent', 'name').lean();
		if (!parcel) return res.status(404).json({ message: 'Parcel not found' });
		res.json(toPublicParcel(parcel));
	} catch (err) {
		console.error('Track parcel error:', err);
		res.status(500).json({ message: 'Fetch parcel failed' });
	}
}

export async function assignAgent(req, res) {
	try {
		if (!isObjectId(req.params.id)) return badId(res);
		const { agentId } = req.body || {};
		if (!isObjectId(agentId)) return res.status(400).json({ message: 'Invalid agent' });

		const parcel = await Parcel.findById(req.params.id);
		if (!parcel) return res.status(404).json({ message: 'Not found' });
		if (!['Pending', 'Assigned'].includes(parcel.status)) {
			return res.status(400).json({ message: `Cannot reassign a parcel that is ${parcel.status}` });
		}
		const agent = await User.findById(agentId);
		if (!agent || agent.role !== 'agent' || !agent.isActive || agent.emailVerified === false) {
			return res.status(400).json({ message: 'Agent is not active' });
		}

		const previousAgent = parcel.agent ? String(parcel.agent) : null;
		parcel.agent = agentId;
		if (parcel.status !== 'Assigned') parcel.statusHistory.push({ status: 'Assigned', by: req.user.id, role: req.user.role });
		parcel.status = 'Assigned';
		await parcel.save();

		invalidateAgentRooms(agentId);
		invalidateAgentRooms(previousAgent);

		const populated = await Parcel.findById(parcel.id)
			.populate('customer', 'name email phone')
			.populate('agent', 'name email phone');
		const payload = { id: parcel.id, status: parcel.status, agent: publicAgent(populated.agent) };
		emitToParcel(populated, 'parcel:update', payload);
		if (previousAgent && previousAgent !== String(agentId)) {
			emitToParcel({ _id: parcel._id, agent: previousAgent }, 'parcel:update', payload);
		}

		res.json(populated);
	} catch (err) {
		console.error('Assign agent error:', err);
		res.status(500).json({ message: 'Assignment failed' });
	}
}

export async function updateStatus(req, res) {
	try {
		if (!isObjectId(req.params.id)) return badId(res);
		const { status } = req.body || {};
		if (!PARCEL_STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid status' });
		if (!['admin', 'agent'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });

		const parcel = await Parcel.findById(req.params.id).populate('customer', 'name email');
		if (!parcel) return res.status(404).json({ message: 'Not found' });
		if (req.user.role === 'agent' && String(parcel.agent) !== String(req.user.id)) {
			return res.status(403).json({ message: 'Forbidden' });
		}
		const error = transitionError(req.user.role, parcel.status, status);
		if (error) return res.status(400).json({ message: error });
		if (ACTIVE_STATUSES.includes(status) && !parcel.agent) {
			return res.status(400).json({ message: 'Assign an agent first' });
		}

		parcel.status = status;
		parcel.statusHistory.push({ status, by: req.user.id, role: req.user.role });
		await parcel.save();
		invalidateAgentRooms(parcel.agent);

		emitToParcel(parcel, 'parcel:update', { id: parcel.id, status: parcel.status });

		// Email is best-effort and must not delay or fail the status change
		const to = parcel?.customer?.email;
		if (to) {
			sendStatusEmail({ to, parcel, newStatus: status }).catch(err =>
				console.error('Status email failed:', err?.message || err)
			);
		}
		res.json(parcel);
	} catch (err) {
		console.error('Update status error:', err);
		res.status(500).json({ message: 'Update status failed' });
	}
}

export async function updateLocation(req, res) {
	try {
		if (!isObjectId(req.params.id)) return badId(res);
		const lat = Number(req.body?.lat);
		const lng = Number(req.body?.lng);
		if (!isValidLatLng(lat, lng)) return res.status(400).json({ message: 'Invalid coordinates' });
		const { etaMinutes } = req.body || {};
		if (etaMinutes != null && (!Number.isFinite(Number(etaMinutes)) || Number(etaMinutes) < 0 || Number(etaMinutes) > 10000)) {
			return res.status(400).json({ message: 'Invalid ETA' });
		}

		const parcel = await Parcel.findById(req.params.id);
		if (!parcel) return res.status(404).json({ message: 'Not found' });
		if (req.user.role !== 'agent' || String(parcel.agent) !== String(req.user.id)) {
			return res.status(403).json({ message: 'Forbidden' });
		}
		if (!ACTIVE_STATUSES.includes(parcel.status)) {
			return res.status(400).json({ message: `Location cannot be updated for a ${parcel.status} parcel` });
		}

		parcel.currentLocation = { lat, lng, updatedAt: new Date() };
		if (etaMinutes != null) parcel.etaMinutes = Number(etaMinutes);
		await parcel.save();

		emitToParcel(parcel, 'parcel:location', {
			id: parcel.id,
			parcelId: parcel.id,
			trackingCode: parcel.trackingCode,
			currentLocation: parcel.currentLocation,
			location: parcel.currentLocation,
			etaMinutes: parcel.etaMinutes
		});

		res.json(parcel);
	} catch (err) {
		console.error('Update location error:', err);
		res.status(500).json({ message: 'Update location failed' });
	}
}

export async function deleteParcel(req, res) {
	try {
		if (!isObjectId(req.params.id)) return badId(res);
		const parcel = await Parcel.findByIdAndDelete(req.params.id);
		if (!parcel) return res.status(404).json({ message: 'Not found' });
		invalidateAgentRooms(parcel.agent);
		res.json({ success: true });
	} catch (err) {
		console.error('Delete parcel error:', err);
		res.status(500).json({ message: 'Delete parcel failed' });
	}
}
