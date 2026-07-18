import { User } from '../models/User.js';
import { signJwt } from '../utils/jwt.js';

export async function register(req, res) {
	try {
		const { name, email, password, role, phone } = req.body;

		// Validate required fields
		if (!name || !email || !password) {
			return res.status(400).json({ 
				message: 'Name, email, and password are required' 
			});
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({ message: 'Invalid email format' });
		}

		// Validate password length
		if (password.length < 6) {
			return res.status(400).json({ 
				message: 'Password must be at least 6 characters long' 
			});
		}

		const existing = await User.findOne({ email });
		if (existing) return res.status(400).json({ message: 'Email already in use' });

		const user = await User.create({ 
			name, 
			email, 
			password, 
			role: role || 'customer', 
			phone 
		});

		const token = signJwt({ id: user.id, role: user.role });
		return res.status(201).json({
			user: { id: user.id, name: user.name, email: user.email, role: user.role },
			token
		});
	} catch (err) {
		console.error('Registration error:', err);
		return res.status(500).json({ 
			message: 'Registration failed', 
			error: err.message 
		});
	}
}

export async function login(req, res) {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email }).select('+password');
		if (!user) return res.status(400).json({ message: 'Invalid credentials' });
		const ok = await user.comparePassword(password);
		if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
		const token = signJwt({ id: user.id, role: user.role });
		return res.json({
			user: { id: user.id, name: user.name, email: user.email, role: user.role },
			token
		});
	} catch (err) {
		return res.status(500).json({ message: 'Login failed' });
	}
}
