import { startSyncWorker } from './sync.worker.js';

startSyncWorker();
import { startAnalysisWorker, startFixWorker, startWebhookWorker } from './other.worker.js';
import { logger }              from '../utils/logger.js';

export function startWorkers() {
  logger.info('Starting all background workers...');

  startSyncWorker();
  startAnalysisWorker();
  startFixWorker();
  startWebhookWorker();

  logger.info('All workers running');
}