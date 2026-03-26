import pino from 'pino';
import { config } from '../config/index.js';

export const logger = pino({
  level: config.isDev ? 'debug' : 'info',
  transport: config.isDev
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
  base: { service: 'ai-growth-manager' },
});