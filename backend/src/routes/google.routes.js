import express from 'express';
import { getGoogleAuthUrl, handleGoogleCallback } from '../controllers/google.controller.js';

const router = express.Router();

// Get Google OAuth URL
router.get('/auth/google', getGoogleAuthUrl);

// Handle Google OAuth callback
router.get('/auth/google/callback', handleGoogleCallback);

export default router;
