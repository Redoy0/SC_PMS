import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { User, Roles } from '../models/User.js';
import { normalizeEmail, normalizeName, normalizePhone, isObjectId } from '../utils/validation.js';
import { randomToken, sha256 } from '../utils/tokens.js';
import { appUrl, sendAgentInviteEmail } from '../utils/mailer.js';
import { revokeAllSessions } from '../services/session.service.js';
import { wrap } from '../utils/asyncHandler.js';

const router = Router();
const INVITE_TTL_HOURS = 72;

router.use(requireAuth);

router.get('/me', wrap(async (req, res) => {
	const user = await User.findById(req.user.id);
	if (!user) return res.status(404).json({ message: 'Not found' });
	res.json(user.toPublic());
}));

router.get('/', requireRoles('admin'), wrap(async (req, res) => {
	const filter = {};
	if (typeof req.query.role === 'string' && Roles.includes(req.query.role)) {
		filter.role = req.query.role;
	}
	const users = await User.find(filter).sort({ createdAt: -1 });
	res.json(users.map(u => u.toPublic()));
}));

// Creates the invite token and emails it. If the email cannot be delivered the
// link is returned to the admin so it can be shared another way.
async function sendInvite(user) {
	const token = randomToken(32);
	user.passwordReset = {
		tokenHash: sha256(token),
		expiresAt: new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000),
		requestedAt: new Date()
	};
	await user.save();
	const link = `${appUrl()}/reset-password?token=${token}&invite=1`;
	try {
		await sendAgentInviteEmail({ to: user.email, name: user.name, link, hours: INVITE_TTL_HOURS });
		return { emailSent: true };
	} catch (err) {
		console.error('Agent invite email failed:', err?.message || err);
		return { emailSent: false, inviteLink: link };
	}
}

// Delivery agents are onboarded by an admin, never through public sign-up
router.post('/agents', requireRoles('admin'), async (req, res) => {
	try {
		const name = normalizeName(req.body?.name);
		const email = normalizeEmail(req.body?.email);
		const phone = normalizePhone(req.body?.phone);
		if (!name) return res.status(400).json({ message: 'Enter the agent\'s full name' });
		if (!email) return res.status(400).json({ message: 'Enter a valid email address' });
		if (!phone) return res.status(400).json({ message: 'Enter a valid Bangladeshi mobile number (01XXXXXXXXX)' });

		if (await User.exists({ email })) {
			return res.status(409).json({ message: 'A user with this email already exists' });
		}

		const user = new User({
			name,
			email,
			phone,
			role: 'agent',
			// Unusable random password until the agent sets their own via the invite
			password: randomToken(32),
			emailVerified: false,
			createdBy: req.user.id
		});
		await user.save();
		const invite = await sendInvite(user);
		res.status(201).json({ user: user.toPublic(), ...invite });
	} catch (err) {
		if (err?.code === 11000) return res.status(409).json({ message: 'A user with this email already exists' });
		console.error('Create agent error:', err);
		res.status(500).json({ message: 'Could not create agent' });
	}
});

router.post('/:id/resend-invite', requireRoles('admin'), wrap(async (req, res) => {
	if (!isObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid user id' });
	const user = await User.findById(req.params.id);
	if (!user || user.role !== 'agent') return res.status(404).json({ message: 'Agent not found' });
	if (user.emailVerified !== false) return res.status(400).json({ message: 'This agent has already activated their account' });
	const invite = await sendInvite(user);
	res.json({ user: user.toPublic(), ...invite });
}));

router.patch('/:id/status', requireRoles('admin'), wrap(async (req, res) => {
	if (!isObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid user id' });
	if (typeof req.body?.isActive !== 'boolean') return res.status(400).json({ message: 'isActive must be true or false' });
	if (req.params.id === req.user.id) return res.status(400).json({ message: 'You cannot change your own account status' });

	const user = await User.findById(req.params.id);
	if (!user) return res.status(404).json({ message: 'User not found' });

	user.isActive = req.body.isActive;
	if (!user.isActive) {
		// Sign the user out everywhere immediately
		user.tokenVersion = (user.tokenVersion || 0) + 1;
		await revokeAllSessions(user._id);
	}
	await user.save();
	res.json(user.toPublic());
}));

export default router;
