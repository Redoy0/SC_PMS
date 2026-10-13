import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const USER_ROLES = ['admin', 'agent', 'customer'];
const BCRYPT_ROUNDS = Math.min(Math.max(Number(process.env.BCRYPT_ROUNDS) || 12, 10), 14);

export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;

const userSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true, maxlength: 80 },
		email: { type: String, required: true, unique: true, lowercase: true, trim: true },
		phone: { type: String, trim: true },
		password: { type: String, required: true, select: false },
		role: { type: String, enum: USER_ROLES, default: 'customer' },
		isActive: { type: Boolean, default: true },

		// Accounts created before verification existed have no value here and
		// are treated as verified; only an explicit `false` blocks sign-in.
		emailVerified: { type: Boolean },
		emailVerification: {
			codeHash: { type: String, select: false },
			expiresAt: { type: Date, select: false },
			attempts: { type: Number, default: 0, select: false },
			lastSentAt: { type: Date, select: false }
		},
		passwordReset: {
			tokenHash: { type: String, select: false, index: true, sparse: true },
			expiresAt: { type: Date, select: false },
			requestedAt: { type: Date, select: false }
		},

		// Incremented on password change/reset and deactivation to revoke access tokens
		tokenVersion: { type: Number, default: 0 },
		failedLoginAttempts: { type: Number, default: 0, select: false },
		lockUntil: { type: Date, select: false },
		lastLoginAt: { type: Date },
		createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
	},
	{ timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
	if (!this.isModified('password')) return next();
	const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
	this.password = await bcrypt.hash(this.password, salt);
	next();
});

userSchema.methods.comparePassword = async function (candidate) {
	return bcrypt.compare(candidate, this.password);
};

userSchema.methods.isLocked = function () {
	return Boolean(this.lockUntil && this.lockUntil > new Date());
};

// Fields that are safe to send to the client
userSchema.methods.toPublic = function () {
	return {
		id: this.id,
		_id: this.id,
		name: this.name,
		email: this.email,
		phone: this.phone,
		role: this.role,
		isActive: this.isActive,
		emailVerified: this.emailVerified !== false,
		lastLoginAt: this.lastLoginAt,
		createdAt: this.createdAt
	};
};

export const User = mongoose.model('User', userSchema);
export const Roles = USER_ROLES;
