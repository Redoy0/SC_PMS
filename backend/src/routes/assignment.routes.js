import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { wrap } from '../utils/asyncHandler.js';

const router = Router();

router.use(requireAuth);

// Agents that can receive parcels: active and have activated their account
router.get('/agents', requireRoles('admin'), wrap(async (_req, res) => {
	const agents = await User.find({ role: 'agent', isActive: true, emailVerified: { $ne: false } })
		.select('_id name email phone');
	res.json(agents);
}));

export default router;
