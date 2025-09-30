import redis from "../configs/redis.js";

// Define the shape of a job object from Redis
interface Job {
  status: "queued" | "processing" | "completed" | "failed";
  type?: string | undefined;
  processingTime?: string | undefined;
}

// Define the shape of the stats object
interface JobStats {
  total: number;
  queued: 0;
  processing: 0;
  completed: 0;
  failed: 0;
  byType: Record<string, number>;
  processingTimes: Record<
    string,
    { average: number; count: number; min: number; max: number }
  >;
}

// Helper function to validate and convert Redis data to Job
function isValidJob(data: unknown): data is Job {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const job = data as Record<string, string>;
  const validStatuses = ["queued", "processing", "completed", "failed"];
  return "status" in job && validStatuses.includes(job.status);
}

// Get all job keys
async function getAllJobKeys(): Promise<string[]> {
  const keys = await redis.keys("job:*");
  return (keys || []).filter((key: string) => key !== "job-queue");
}

// Get job statistics
async function getJobStats(): Promise<JobStats> {
  try {
    const jobKeys = await getAllJobKeys();
    const stats: JobStats = {
      total: 0,
      queued: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      byType: {},
      processingTimes: {},
    };
    // Temporary storage for processing times
    const tempProcessingTimes: Record<string, number[]> = {};

    for (const key of jobKeys) {
      const rawJob = await redis.hgetall(key);
      if (isValidJob(rawJob)) {
        const job: Job = {
          status: rawJob.status,
          type: rawJob.type,
          processingTime: rawJob.processingTime,
        };
        stats.total++;
        stats[job.status] ??= 0;
        stats[job.status]++;

        // Count by job type
        if (job.type) {
          const type = job.type;
          stats.byType[type] ??= 0;
          stats.byType[type]++;
        }

        // Collect processing times for completed jobs
        if (job.status === "completed" && job.processingTime) {
          const jobType = job.type || "unknown";
          tempProcessingTimes[jobType] ??= [];
          tempProcessingTimes[jobType].push(parseFloat(job.processingTime));
        }
      }
    }

    // Calculate average processing times
    for (const [jobType, times] of Object.entries(tempProcessingTimes)) {
      if (times.length > 0) {
        const avgTime =
          times.reduce((sum, time) => sum + time, 0) / times.length;
        stats.processingTimes[jobType] = {
          average: avgTime,
          count: times.length,
          min: Math.min(...times),
          max: Math.max(...times),
        };
      }
    }

    return stats;
  } catch (error) {
    console.error("Error getting job stats:", error);
    throw error;
  }
}

export { getJobStats, getAllJobKeys };
