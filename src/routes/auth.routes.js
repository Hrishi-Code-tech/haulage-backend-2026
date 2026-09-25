import express from 'express';
import {login, signup} from '../controllers/auth.controller.js';
import {asyncHandler} from '../utils/asyncHandler.js';

const router = express.Router();
router.post('/signup', asyncHandler(signup));
router.post('/login', asyncHandler(login));

export default router;