import dotenv from 'dotenv';
dotenv.config();
import express              from 'express';
import helmet               from 'helmet';
import cors                 from 'cors';
import rateLimit            from 'express-rate-limit';
import { requestLogger, errorHandler } from './middlewares/index.js';
import routes               from './routes/index.js';
import { config }           from './config/index.js';
import path                 from 'path';
import { fileURLToPath }    from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      config.isDev ? '*' : process.env.FRONTEND_URL,
  credentials: true,
}));

// ─── Body parsing ─────────────────────────────────────────────────────────────
// rawBody is needed for Shopify HMAC webhook verification
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// ─── Request logging ──────────────────────────────────────────────────────────
app.use(requestLogger);

// ─── Serve frontend static files for Shopify embedded apps ─────────────────────
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

// ─── Rate limiting for public endpoints ─────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute for webhooks
  message: { error: 'Webhook rate limit exceeded.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply stricter rate limits to auth endpoints
app.use('/api/auth', authLimiter);
app.use('/auth', authLimiter);
app.use('/webhooks', webhookLimiter);

// ─── Health check (for load balancer / uptime) ────────────────────────────────
app.get('/ping', (_req, res) => res.json({ status: 'ok' }));

// ─── All API routes (includes Shopify embedded app launch handler at /) ───────────
app.use('/', routes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ─── Global error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);
console.log(process.env.DATABASE_URL);

