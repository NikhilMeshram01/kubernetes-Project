import redis from "../configs/redis.js";
import { processJob } from "./processJobs.js";
import { jobErrorsTotal, queueLength } from "./promClient.js";

let isShuttingDown = false;

export async function worker(): Promise<void> {
  if (isShuttingDown) return;
  try {
    while (!isShuttingDown) {
      // Get job from queue (blocking pop with timeout)
      const jobData = await redis.brpop("job-queue", 5);

      if (jobData && !isShuttingDown) {
        await processJob(jobData[1]); // Use jobData[1] to access the popped value
      } else {
        // Update queue length metric when no jobs available
        const queueLengthValue = await redis.llen("job-queue");
        queueLength.set(queueLengthValue);
      }
    }
  } catch (error) {
    console.error("Worker error:", error);
    jobErrorsTotal.inc({ error_type: "worker_error" });

    if (!isShuttingDown) {
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, 5000));
      // Restart worker
      return worker();
    }
  }
}

// Handle shutdown
export function shutdownWorker(): void {
  isShuttingDown = true;
}
