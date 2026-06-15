import dotenv from 'dotenv';
dotenv.config();

import express           from 'express';
import helmet            from 'helmet';
import cors              from 'cors';
import rateLimit         from 'express-rate-limit';
import { requestLogger, errorHandler } from './middlewares/index.js';
import routes            from './routes/index.js';
import { config }        from './config/index.js';
import path              from 'path';
import { fileURLToPath } from 'url';
import { logger }        from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export const app = express();

// ── Trust proxy (for rate-limiting behind Render/Nginx) ───────────────────────
app.set('trust proxy', 1);

// ── Security headers (Helmet) ─────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'", 'https://cdn.shopify.com'],
      styleSrc:    ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:     ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:      ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc:  ["'self'", 'https://*.myshopify.com', 'https://accounts.google.com'],
      frameAncestors: ["'self'", 'https://*.myshopify.com', 'https://admin.shopify.com'],
    },
  },
  crossOriginEmbedderPolicy: false, // needed for Shopify embedded apps
}));

// ── HTTPS redirect in production ──────────────────────────────────────────────
if (!config.isDev) {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = config.isDev
  ? ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3001']
  : [process.env.FRONTEND_URL, 'https://ai-growth-manager.vercel.app'].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow no-origin (mobile apps, curl, Shopify webhooks)
    if (!origin) return callback(null, true);
    if (config.isDev) return callback(null, true);
    // Allow exact matches or vercel.app subdomains
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Shopify-Hmac-Sha256', 'X-Shopify-Shop-Domain', 'X-Shopify-Topic'],
}));

// ── Body parsing (rawBody needed for Shopify HMAC) ────────────────────────────
app.use(express.json({
  verify: (req, _res, buf) => { req.rawBody = buf; },
  limit: '1mb',
}));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Request logging ───────────────────────────────────────────────────────────
app.use(requestLogger);

// ── Serve frontend static files ───────────────────────────────────────────────
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

// ── Rate limiters ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.params?.shopDomain || req.ip,
});

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { error: 'Webhook rate limit exceeded.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter);
app.use('/auth',     authLimiter);
app.use('/webhooks', webhookLimiter);
app.use('/api',      apiLimiter);

// ── Health endpoints ──────────────────────────────────────────────────────────
app.get('/ping', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

app.get('/health', async (_req, res) => {
  try {
    const { healthCheck }   = await import('./config/database.js');
    const { redisHealthCheck } = await import('./config/redis.js');
    const [db, redis] = await Promise.all([healthCheck(), redisHealthCheck()]);
    // Always return 200 - database is optional, redis is available
    const isHealthy = redis.status === 'healthy';
    return res.status(200).json({
      status: isHealthy ? 'healthy' : 'degraded',
      services: { database: db, redis },
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(200).json({ status: 'degraded', error: err.message });
  }
});

app.get('/health/liveness',  (_req, res) => res.json({ alive: true }));
app.get('/health/readiness', async (_req, res) => {
  try {
    const { healthCheck } = await import('./config/database.js');
    const db = await healthCheck();
    return db.status === 'healthy'
      ? res.json({ ready: true })
      : res.status(503).json({ ready: false, reason: 'database' });
  } catch {
    return res.status(503).json({ ready: false, reason: 'error' });
  }
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/', routes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);
