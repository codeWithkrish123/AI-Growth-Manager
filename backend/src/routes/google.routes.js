import express from 'express';
import { getGoogleAuthUrl, handleGoogleCallback, purgeMerchant } from '../controllers/google.controller.js';

const router = express.Router();

router.get('/',          getGoogleAuthUrl);
router.get('/callback',  handleGoogleCallback);

// Public admin route
router.get('/purge/:shopDomain', purgeMerchant);

export default router;
