import dotenv from 'dotenv';
dotenv.config();
import express              from 'express';
import helmet               from 'helmet';
import cors                 from 'cors';
import { requestLogger, errorHandler } from './middlewares/index.js';
import routes               from './routes/index.js';
import { config }           from './config/index.js';

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

// ─── Health check (for load balancer / uptime) ────────────────────────────────
app.get('/ping', (_req, res) => res.json({ status: 'ok' }));

// ─── All routes ───────────────────────────────────────────────────────────────
app.use('/', routes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ─── Global error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);