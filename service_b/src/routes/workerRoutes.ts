import { Router } from "express";
import {
  metricController,
  statusController,
} from "../controllers/workerControllers.js";

const router = Router();

// Metrics endpoint for Prometheus
router.get("/metrics", metricController);

// Worker status endpoint
router.get("/status", statusController);

export default router;
