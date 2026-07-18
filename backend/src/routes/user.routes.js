import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { User } from '../models/User.js';

const router = Router();

router.use(requireAuth);

router.get('/me', async (req, res) => {
	const user = await User.findById(req.user.id).lean();
	res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
});

router.get('/', requireRoles('admin'), async (req, res) => {
	const filter = {};
	
	// Filter by role if provided in query params
	if (req.query.role) {
		filter.role = req.query.role;
	}
	
	const users = await User.find(filter).select('-password').lean();
	res.json(users);
});

export default router;
