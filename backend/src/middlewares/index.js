import crypto               from 'crypto';
import pinoHttp             from 'pino-http';
import rateLimit            from 'express-rate-limit';
import { Merchant }         from '../models/index.js';
import { logger }           from '../utils/logger.js';
import { UnauthorizedError } from '../utils/error.js';
import { config }           from '../config/index.js';
import { error }            from '../utils/response.js';

// ─── Request Logger ───────────────────────────────────────────────────────────
export const requestLogger = pinoHttp({ logger });

// ─── Auth Middleware ──────────────────────────────────────────────────────────
// Validates that a merchant exists for the given shopDomain and attaches it to req.
export async function authMiddleware(req, res, next) {
  try {
    const shopDomain = req.params.shopDomain || req.query.shop;

    if (!shopDomain) {
      throw new UnauthorizedError('Missing shop domain');
    }

    const merchant = await Merchant.findOne({ shopDomain, isActive: true });

    if (!merchant) {
      throw new UnauthorizedError('Merchant not found or not installed');
    }

    req.merchant = merchant;
    next();
  } catch (err) {
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
    .createHmac('sha256', config.shopify.apiSecret)
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