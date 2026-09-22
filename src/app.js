// src/app.js
import express from 'express';
import {webhookRoutes} from './routes/webhook.routes.js';
import {internalRoutes} from './routes/internal.routes.js';
import telemetryRoutes from './routes/telemetry.routes.js';
import { ApiError } from './utils/ApiError.js';
import { ApiResponse } from './utils/ApiResponse.js';
import mediaRoutes from './routes/media.routes.js';


const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
	res.status(200).json(new ApiResponse(200, 'Service is healthy'));
});

// Mount route groups
app.use('/api/webhooks', webhookRoutes);
app.use('/internal', internalRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/media', mediaRoutes);

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