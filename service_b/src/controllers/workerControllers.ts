import type { Request, Response } from "express";
import redis from "../configs/redis.js";
import { queueLength, register } from "../utils/promClient.js";
import catchAsync from "../utils/catchAsync.js";

export const metricController = catchAsync(
  async (req: Request, res: Response) => {
    // Update queue length metric
    const queueLengthValue = await redis.llen("job-queue");
    queueLength.set(queueLengthValue);

    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  }
);

export const statusController = catchAsync(
  async (req: Request, res: Response) => {
    const queueLengthValue = await redis.llen("job-queue");
    const metrics = await register.getMetricsAsJSON();

    // Remove redundant type assertions
    const jobsProcessedMetric = metrics.find(
      (m) => m.name === "worker_jobs_processed_total"
    );
    const processingTimeMetric = metrics.find(
      (m) => m.name === "worker_job_processing_time_seconds"
    );

    res.json({
      status: "running",
      queueLength: queueLengthValue,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      metrics: {
        jobsProcessed: jobsProcessedMetric?.values ?? [],
        avgProcessingTime: processingTimeMetric?.values ?? [],
      },
    });
  }
);
