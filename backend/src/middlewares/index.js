import crypto               from 'crypto';
import pinoHttp             from 'pino-http';
import rateLimit            from 'express-rate-limit';
import jwt                  from 'jsonwebtoken';
import { MerchantModel }    from '../models/index.js';
import { logger }           from '../utils/logger.js';
import { UnauthorizedError } from '../utils/error.js';
import { config }           from '../config/index.js';
import { error }            from '../utils/response.js';

// ─── Request Logger ───────────────────────────────────────────────────────────
export const requestLogger = pinoHttp({ logger });

// ─── Auth Middleware ──────────────────────────────────────────────────────────
// Validates JWT token and that a merchant exists for the given shopDomain.
export async function authMiddleware(req, res, next) {
  try {
    const shopDomain = req.params.shopDomain || req.query.shop;
    const authHeader = req.headers.authorization;

    logger.debug({ 
      shopDomain, 
      hasAuthHeader: !!authHeader,
      url: req.originalUrl 
    }, 'Auth middleware processing request');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn({ url: req.originalUrl }, 'Missing or invalid Authorization header');
      throw new UnauthorizedError('Authentication required');
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    const secret = process.env.JWT_SECRET || config.jwt.secret;
    // Log the first 4 chars of the secret to check for mismatch
    logger.debug({ 
        secretSnippet: secret ? (secret.substring(0, 4) + '...') : 'NULL',
        tokenSnippet: token.substring(0, 15) + '...'
    }, 'Attempting JWT verification');

    try {
      decoded = jwt.verify(token, secret);
    } catch (jwtErr) {
      logger.error({ 
        err: jwtErr.message, 
        secretSnippet: secret ? (secret.substring(0, 4) + '...') : 'NULL',
        tokenSnippet: token.substring(0, 15) + '...' 
      }, 'JWT verification failed');
      throw new UnauthorizedError('Invalid or expired token: ' + jwtErr.message);
    }

    if (!shopDomain) {
      logger.warn('Missing shop domain in request');
      throw new UnauthorizedError('Missing shop domain');
    }

    // Normalized shop domain lookup
    const cleanShop = shopDomain.replace('.myshopify.com', '').toLowerCase() + '.myshopify.com';
    const merchant = await MerchantModel.findOne({ shopDomain: cleanShop });

    if (!merchant) {
      logger.warn({ shopDomain: cleanShop }, 'Merchant not found in database');
      throw new UnauthorizedError('Store not connected. Please connect your Shopify store.');
    }
    
    if (!merchant.isActive) {
      logger.warn({ shopDomain: cleanShop }, 'Merchant found but not active');
      throw new UnauthorizedError('Store subscription inactive or uninstalled');
    }

    // Optional: Verify that the token's user has access to this shop
    // If merchant record has user info or email, we could compare
    // For now, if they have a valid JWT signed by US, and the shop exists, we allow it

    req.merchant = merchant;
    req.user = decoded;
    next();
  } catch (err) {
    logger.error({ 
      err: err.message, 
      shopDomain: req.params.shopDomain || req.query.shop,
      code: err.code 
    }, 'Auth middleware unauthorized');
    return error(res, err);
  }
}

// ─── Shopify HMAC Webhook Validator ──────────────────────────────────────────
// Verifies the X-Shopify-Hmac-Sha256 header on incoming webhooks.
export function shopifyHmac(req, res, next) {
  const hmacHeader = req.headers['x-shopify-hmac-sha256'];
  const body       = req.rawBody; // set by express.json({ verify: ... })

  if (!hmacHeader || !body) {
    return res.status(401).json({ error: 'Missing HMAC or body' });
  }

  const digest = crypto
    .createHmac('sha256', config.shopify.webhookSecret)
    .update(body, 'utf8')
    .digest('base64');

  if (!crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader))) {
    logger.warn('Webhook HMAC mismatch — rejected');
    return res.status(401).json({ error: 'Invalid HMAC' });
  }

  next();
}

// ─── Rate Limiter ─────────────────────────────────────────────────────────────
// 60 requests per minute per shop domain.
export const rateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      60,
  keyGenerator: (req) => req.params.shopDomain || req.query.shop || req.ip,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Must be registered LAST in app.js with 4 parameters.
export function errorHandler(err, req, res, _next) {
  logger.error({ err, url: req.url }, 'Unhandled error');
  return error(res, err);
}
