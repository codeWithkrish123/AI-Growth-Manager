import { logger } from '../utils/logger.js';

export function startWorkers() {
  logger.info('Workers disabled (Redis not installed)');
}