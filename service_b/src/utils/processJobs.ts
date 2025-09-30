import redis from "../configs/redis.js";
import { operations, type OperationType } from "./operations.js";
import {
  jobErrorsTotal,
  jobProcessingTimeSeconds,
  jobsProcessedTotal,
} from "./promClient.js";

// Define job data interface
interface Job {
  id: string;
  type: OperationType;
  data: any;
}

// Process a single job
export async function processJob(jobData: string): Promise<void> {
  const startTime = Date.now();

  const job = JSON.parse(jobData) as Job;

  try {
    if (!job.id || !job.type) {
      throw new Error("Invalid job format: missing id or type");
    }
    console.log(`Processing job ${job.id} of type ${job.type}`);

    // Update job status to processing
    await redis.hset(`job:${job.id}`, {
      status: "processing",
      startedAt: new Date().toISOString(),
    });

    // Execute the operation
    const operation = operations[job.type];
    if (!operation) {
      throw new Error(`Unknown job type: ${job.type}`);
    }

    const result = await operation(job.data);
    const processingTime = (Date.now() - startTime) / 1000;

    // Store result with expiration
    await redis.set(`result:${job.id}`, JSON.stringify(result), "EX", 3600);

    // Update job status to completed
    await redis.hset(`job:${job.id}`, {
      status: "completed",
      completedAt: new Date().toISOString(),
      processingTime: processingTime.toString(),
    });

    // Update metrics
    jobsProcessedTotal.inc({ job_type: job.type, status: "completed" });
    jobProcessingTimeSeconds.observe({ job_type: job.type }, processingTime);

    console.log(`Job ${job.id} completed in ${processingTime}s`);
  } catch (error: any) {
    const processingTime = (Date.now() - startTime) / 1000;

    console.error(`Error processing job ${job?.id || "unknown"}:`, error);

    // Update job status to failed
    await redis.hset(`job:${job.id}`, {
      status: "failed",
      error: error.message || "Unknown error",
      failedAt: new Date().toISOString(),
      processingTime: processingTime.toString(),
    });

    // Update metrics
    jobsProcessedTotal.inc({
      job_type: job?.type || "unknown",
      status: "failed",
    });
    jobErrorsTotal.inc({ error_type: "processing_error" });
    jobProcessingTimeSeconds.observe(
      { job_type: job?.type || "unknown" },
      processingTime
    );
  }
}
