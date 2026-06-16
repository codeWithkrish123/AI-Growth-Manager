import express from 'express';
import { getGoogleAuthUrl, handleGoogleCallback } from '../controllers/google.controller.js';

const router = express.Router();

router.get('/',          getGoogleAuthUrl);
router.get('/callback',  handleGoogleCallback);
router.get('/debug', async (req, res) => {
    try {
        const { oauth2Client } = await import('../config/google.js');
        res.json({
            "Copy this to Google Console": oauth2Client.redirectUri || oauth2Client._redirectUri,
            "Current Client ID": process.env.GOOGLE_CLIENT_ID ? (process.env.GOOGLE_CLIENT_ID.substring(0, 10) + '...') : 'MISSING',
            "APP_URL": process.env.APP_URL || 'NOT SET'
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to load debug info', details: err.message });
    }
});

export default router;
