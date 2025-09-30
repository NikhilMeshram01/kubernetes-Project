import redis from "../configs/redis.js";
import { getJobStats } from "./jobsStats.js";
import {
  averageProcessingTime,
  queueLength,
  totalJobsCompleted,
} from "./promClient.js";

// Update Prometheus metrics
export async function updateMetrics() {
  try {
    // Get current stats
    const stats = await getJobStats();
    const queueLengthValue = await redis.llen("job-queue");

    // Update queue length
    queueLength.set(queueLengthValue);

    // Update job completion metrics
    for (const [jobType, count] of Object.entries(stats.byType)) {
      // Note: In a real system, you'd track these incrementally
      // For now, we'll set the total values
      totalJobsCompleted.inc(
        { job_type: jobType, status: "completed" },
        stats.completed
      );
      totalJobsCompleted.inc(
        { job_type: jobType, status: "failed" },
        stats.failed
      );
    }

    // Update average processing times
    for (const [jobType, timeData] of Object.entries(stats.processingTimes)) {
      averageProcessingTime.set({ job_type: jobType }, timeData.average);
    }
  } catch (error) {
    console.error("Error updating metrics:", error);
  }
}
