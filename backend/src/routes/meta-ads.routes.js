import { Router } from 'express';
import { rateLimiter } from '../middlewares/index.js';
import { getMetaAuthUrl, handleMetaCallback, getMetaAccounts } from '../controllers/meta-ads.controller.js';
const router = Router();
router.post('/meta/auth-url',  rateLimiter, getMetaAuthUrl);
router.get('/meta/callback',  rateLimiter, handleMetaCallback);
router.get('/meta/accounts',   rateLimiter, getMetaAccounts);
export default router;
