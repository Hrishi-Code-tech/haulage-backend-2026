import express from 'express';
import { getOrders, getOrderById, getCarriers } from '../controllers/orders.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/', asyncHandler(getOrders));
router.get('/carriers', asyncHandler(getCarriers));
router.get('/:loadId', asyncHandler(getOrderById));

export default router;
