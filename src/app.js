// src/app.js
import express from 'express';
import cors from 'cors';
import {webhookRoutes} from './routes/webhook.routes.js';
import {internalRoutes} from './routes/internal.routes.js';
import telemetryRoutes from './routes/telemetry.routes.js';
import { ApiError } from './utils/ApiError.js';
import { ApiResponse } from './utils/ApiResponse.js';
import mediaRoutes from './routes/media.routes.js';
import authRoutes from './routes/auth.routes.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDirectory = path.join(__dirname, '..', 'public');

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());
app.use(express.static(publicDirectory, {index: false}));

app.get('/health', (req, res) => {
	res.status(200).json(new ApiResponse(200, 'Service is healthy'));
});

import ordersRoutes from './routes/orders.routes.js';
import aiRoutes from './routes/ai.routes.js';

// Mount route groups
app.use('/api/webhooks', webhookRoutes);
app.use('/internal', internalRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
	res.sendFile(path.join(publicDirectory, 'landing.html'));
});

app.get('/login', (req, res) => {
	res.sendFile(path.join(publicDirectory, 'index.html'));
});

app.use((req, res, next) => {
	next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
});

app.use((error, req, res, next) => {
	const statusCode = error.statusCode || 500;
	const message = statusCode === 500 ? 'Internal server error' : error.message;
	if (statusCode === 500) console.error(error);
	res.status(statusCode).json(new ApiResponse(statusCode, message, {
		errors: error.errors || [],
	}));
});

export default app;