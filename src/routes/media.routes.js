import express from 'express';
import { createInvoiceUploadUrl, createPalletPhotoUploadUrl } from '../controllers/media.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.post('/invoices/presign', asyncHandler(createInvoiceUploadUrl));
router.post('/pallet-photos/presign', asyncHandler(createPalletPhotoUploadUrl));

export default router;
