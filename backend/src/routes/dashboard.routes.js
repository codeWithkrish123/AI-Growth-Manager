import express from 'express';
import {
  getDashboard,
  triggerAnalysis,
  getLatestAnalysis
} from '../controllers/dashboard.controller.js';
import {
  triggerSync,
  getSyncStatus,
  triggerAnalysis as triggerAnalysisController,
  getLatestAnalysis as getLatestAnalysisController,
  applyFix,
  getFixStatus,
  listFixes,
  previewFixAction,
  getHealthHistory
} from '../controllers/index.js';

const router = express.Router();

// Get dashboard data
router.get('/', getDashboard);

// Trigger sync
router.post('/sync', triggerSync);

// Get sync status
router.get('/sync/:syncJobId', getSyncStatus);

// Trigger analysis
router.post('/analyze', triggerAnalysis);

// Get latest analysis
router.get('/analysis/latest', getLatestAnalysis);

// Apply fix
router.post('/fix', applyFix);

// Get fix status
router.get('/fix/:fixActionId', getFixStatus);

// Preview fix before applying
router.post('/fix/:fixActionId/preview', previewFixAction);

// List all fixes
router.get('/fixes', listFixes);

// Get health history
router.get('/health-history', getHealthHistory);

export default router;
