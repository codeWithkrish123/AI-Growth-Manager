import express from 'express';
import { getGoogleAuthUrl, handleGoogleCallback } from '../controllers/google.controller.js';

const router = express.Router();

router.get('/',          getGoogleAuthUrl);
router.get('/callback',  handleGoogleCallback);

export default router;
