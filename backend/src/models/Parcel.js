import mongoose from 'mongoose';

export const PARCEL_STATUSES = [
	'Pending',
	'Assigned',
	'Picked Up',
	'In Transit',
	'Delivered',
	'Failed'
];

// Statuses during which an agent is out with the parcel
export const ACTIVE_STATUSES = ['Assigned', 'Picked Up', 'In Transit'];
export const FINAL_STATUSES = ['Delivered', 'Failed'];

export const PARCEL_SIZES = ['Small', 'Medium', 'Large'];
export const PARCEL_TYPES = ['Document', 'Fragile', 'Standard', 'Perishable'];
export const PAYMENT_TYPES = ['COD', 'Prepaid'];
export const MAX_COD_AMOUNT = 500000;

const locationSchema = new mongoose.Schema(
	{
		lat: { type: Number, min: -90, max: 90 },
		lng: { type: Number, min: -180, max: 180 },
		updatedAt: { type: Date }
	},
	{ _id: false }
);

const statusEventSchema = new mongoose.Schema(
	{
		status: { type: String, enum: PARCEL_STATUSES, required: true },
		at: { type: Date, default: Date.now },
		by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		role: { type: String }
	},
	{ _id: false }
);

const parcelSchema = new mongoose.Schema(
	{
		trackingCode: { type: String, required: true, index: true, unique: true },
		customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
		pickupAddress: { type: String, required: true, trim: true, maxlength: 300 },
		deliveryAddress: { type: String, required: true, trim: true, maxlength: 300 },
		parcelSize: { type: String, enum: PARCEL_SIZES, required: true },
		parcelType: { type: String, enum: PARCEL_TYPES, required: true },
		paymentType: { type: String, enum: PAYMENT_TYPES, required: true },
		codAmount: { type: Number, default: 0, min: 0, max: MAX_COD_AMOUNT },
		status: { type: String, enum: PARCEL_STATUSES, default: 'Pending', index: true },
		statusHistory: { type: [statusEventSchema], default: [] },
		currentLocation: { type: locationSchema, default: () => ({}) },
		etaMinutes: { type: Number, min: 0 },
		notes: { type: String, trim: true, maxlength: 500 }
	},
	{ timestamps: true }
);

export const Parcel = mongoose.model('Parcel', parcelSchema);
