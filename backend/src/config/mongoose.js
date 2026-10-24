import mongoose from 'mongoose';

// Ignore unknown fields in queries instead of passing them through
mongoose.set('strictQuery', true);

export async function connectToDatabase() {
	const mongoUri = process.env.MONGODB_URI || (process.env.NODE_ENV === 'production' ? '' : 'mongodb://127.0.0.1:27017/courier_db');
	if (!mongoUri) {
		throw new Error('MONGODB_URI not set');
	}
	try {
		await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
		console.log('MongoDB connected');
	} catch (err) {
		console.error('MongoDB connection error', err?.reason ?? err);
		throw err;
	}
}
