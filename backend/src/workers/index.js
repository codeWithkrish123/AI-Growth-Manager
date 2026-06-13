import { logger } from '../utils/logger.js';
import { startSyncWorker } from './sync.worker.js';
import { startCronWorker } from './cron.worker.js';

export function startWorkers() {
  try {
    startSyncWorker();
    logger.info('BullMQ workers started (sync worker)');
  } catch (err) {
    logger.warn({ err }, 'Sync worker failed to start (non-fatal, continuing)');
  }
  try {
    startCronWorker();
    logger.info('Cron worker started (daily snapshots)');
  } catch (err) {
    logger.warn({ err }, 'Cron worker failed to start (non-fatal)');
  }
}
