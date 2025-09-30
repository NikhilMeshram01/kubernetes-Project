import { Router } from 'express';
import {
  submitController,
  statusController,
  // availableJobTypes,
  // getQueueLength,
} from '../controllers/jobController.js';

const router = Router();

// Submit job endpoint
router.post('/submit', submitController);

// Get job status endpoint
router.get('/status/:id', statusController);

// // Get available job types
// router.get('/job-types', availableJobTypes);

// // Get queue length (for monitoring)
// router.get('/queue-length', getQueueLength);

export default router;
