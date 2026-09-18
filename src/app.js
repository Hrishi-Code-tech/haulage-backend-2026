// src/app.js
import express from 'express';
import {webhookRoutes} from './routes/webhook.routes.js';
import {internalRoutes} from './routes/internal.routes.js';

const app = express();

app.use(express.json());

// Mount route groups
app.use('/api/webhooks', webhookRoutes);
app.use('/internal', internalRoutes);

export default app;