// Must be the first import: other modules read process.env while loading
import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { Server as SocketIOServer } from 'socket.io';
import { connectToDatabase } from './config/mongoose.js';
import { registerSocketHandlers } from './services/socket.js';
import { setIo } from './services/realtime.js';
import { apiLimiter } from './middleware/rateLimits.js';
import { sanitizeInput } from './middleware/sanitize.js';
import authRoutes from './routes/auth.routes.js';
import parcelRoutes from './routes/parcel.routes.js';
import userRoutes from './routes/user.routes.js';
import assignmentRoutes from './routes/assignment.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import geocodeRoutes from './routes/geocode.routes.js';

const isProduction = process.env.NODE_ENV === 'production';

// Comma-separated list of frontend origins allowed to call the API with credentials
const allowedOrigins = (process.env.CLIENT_ORIGIN || (isProduction ? '' : 'http://localhost:5173'))
	.split(',')
	.map(o => o.trim().replace(/\/+$/, ''))
	.filter(Boolean);
if (isProduction && allowedOrigins.length === 0) {
	throw new Error('CLIENT_ORIGIN must be set in production (comma-separated frontend URLs)');
}
const socketOrigins = (process.env.SOCKET_CORS_ORIGIN || '')
	.split(',')
	.map(o => o.trim().replace(/\/+$/, ''))
	.filter(Boolean);

const corsOptions = {
	origin(origin, callback) {
		// Non-browser clients (curl, server-to-server, same-origin proxy) send no Origin
		if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
		return callback(null, false);
	},
	credentials: true
};

const app = express();
// Number of reverse proxies in front of the app (Render = 1; Vercel rewrite + Render = 2)
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS || 1));
const server = http.createServer(app);

const io = new SocketIOServer(server, {
	cors: { origin: [...new Set([...allowedOrigins, ...socketOrigins])], credentials: true },
	maxHttpBufferSize: 64 * 1024
});
setIo(io);
registerSocketHandlers(io);

// Middlewares
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(sanitizeInput);
app.use(morgan(isProduction ? 'combined' : 'dev'));

// Health
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/parcels', parcelRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/geocode', geocodeRoutes);

app.use('/api', (_req, res) => res.status(404).json({ message: 'Not found' }));

// Central error handler: never leak stack traces or internal messages
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
	if (err?.type === 'entity.parse.failed') return res.status(400).json({ message: 'Malformed JSON body' });
	if (err?.type === 'entity.too.large') return res.status(413).json({ message: 'Request body too large' });
	console.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, err);
	if (res.headersSent) return;
	res.status(500).json({ message: 'Internal server error' });
});

process.on('unhandledRejection', (reason) => {
	console.error('Unhandled promise rejection:', reason);
});

// Start
const PORT = process.env.PORT || 5000;

(async () => {
	try {
		await connectToDatabase();
		server.listen(PORT, () => {
			console.log(`Server running on http://localhost:${PORT}`);
			console.log('Allowed origins:', allowedOrigins.join(', ') || '(none)');
		});
	} catch (err) {
		console.error('Failed to start server', err);
		process.exit(1);
	}
})();
