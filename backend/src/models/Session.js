import mongoose from 'mongoose';

// One document per refresh token. Tokens are rotated on every refresh; each
// rotation chain shares a `family` id so that replaying an already-used token
// (a sign of theft) revokes the whole chain.
const sessionSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		tokenHash: { type: String, required: true, unique: true },
		family: { type: String, required: true, index: true },
		expiresAt: { type: Date, required: true },
		revokedAt: { type: Date },
		rotatedAt: { type: Date },
		persistent: { type: Boolean, default: false },
		userAgent: { type: String, maxlength: 300 },
		ip: { type: String, maxlength: 64 }
	},
	{ timestamps: true }
);

// MongoDB removes expired sessions automatically
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.model('Session', sessionSchema);
