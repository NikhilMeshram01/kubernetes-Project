import { Router } from 'express';
import {
  metrics,
  metricsReset,
  statsController,
  statsDetailed,
} from '../controllers/statControllers.js';

const router = Router();

// Stats endpoint
router.get('/stats', statsController);

// Detailed stats endpoint
router.get('/stats/detailed', statsDetailed);

// Metrics endpoint for Prometheus
router.get('/metrics', metrics);

// Reset stats endpoint (for testing)
router.post('/stats/reset', metricsReset);

export default router;
