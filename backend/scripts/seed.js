import 'dotenv/config';
import mongoose from 'mongoose';
import { connectToDatabase } from '../src/config/mongoose.js';
import { User } from '../src/models/User.js';
import { passwordPolicyError } from '../src/utils/validation.js';

// Passwords come from the environment so no known default credentials exist
// in a deployed database. Local development falls back to demo values.
const isProduction = process.env.NODE_ENV === 'production';
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || (isProduction ? '' : 'Admin12345');
const AGENT_EMAIL = process.env.SEED_AGENT_EMAIL || 'agent1@example.com';
const AGENT_PASSWORD = process.env.SEED_AGENT_PASSWORD || (isProduction ? '' : 'Agent12345');

async function ensure({ name, email, password, role, phone }) {
	const existing = await User.findOne({ email });
	if (existing) {
		console.log(`${role} exists:`, email);
		return;
	}
	const error = passwordPolicyError(password);
	if (error) throw new Error(`Seed password for ${email} rejected: ${error}`);
	await User.create({ name, email, password, role, phone, emailVerified: true });
	console.log(`Created ${role}:`, email);
}

async function run() {
	if (isProduction && (!process.env.SEED_ADMIN_PASSWORD || !process.env.SEED_AGENT_PASSWORD)) {
		throw new Error('Set SEED_ADMIN_PASSWORD and SEED_AGENT_PASSWORD before seeding a production database');
	}
	await connectToDatabase();
	await ensure({ name: 'Admin', email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin', phone: '01700000000' });
	await ensure({ name: 'Agent One', email: AGENT_EMAIL, password: AGENT_PASSWORD, role: 'agent', phone: '01800000000' });
	await mongoose.disconnect();
}

run().catch((err) => {
	console.error(err.message || err);
	process.exit(1);
});
