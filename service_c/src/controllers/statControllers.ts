import { type Request, type Response } from "express";
import redis from "../configs/redis.js";
import { getAllJobKeys, getJobStats } from "../utils/jobsStats.js";
import { updateMetrics } from "../utils/updateMetrics.js";
import { register } from "../utils/promClient.js";

const statsController = async (req: Request, res: Response) => {
  try {
    const stats = await getJobStats();
    const queueLengthValue = await redis.llen("job-queue");

    res.json({
      timestamp: new Date().toISOString(),
      queueLength: queueLengthValue,
      jobs: stats,
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
      },
    });
  } catch (error: any) {
    console.error("Error getting stats:", error);
    res.status(500).json({
      error: "Failed to get stats",
      message: error.message,
    });
  }
};
const statsDetailed = async (req: Request, res: Response) => {
  try {
    const stats = await getJobStats();
    const queueLengthValue = await redis.llen("job-queue");
    const jobKeys = (await getAllJobKeys()) ?? [];

    // Get recent jobs
    const recentJobs = [];
    for (let i = 0; i < Math.min(10, jobKeys.length); i++) {
      const key = jobKeys[i];
      if (key) {
        const job = await redis.hgetall(key);
        if (job && Object.keys(job).length > 0) {
          recentJobs.push({
            id: key.replace("job:", ""),
            ...job,
          });
        }
      }
    }

    res.json({
      timestamp: new Date().toISOString(),
      queueLength: queueLengthValue,
      jobs: stats,
      recentJobs: recentJobs,
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
      },
    });
  } catch (error: any) {
    console.error("Error getting detailed stats:", error);
    res.status(500).json({
      error: "Failed to get detailed stats",
      message: error.message,
    });
  }
};
const metrics = async (req: Request, res: Response) => {
  try {
    await updateMetrics();
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    console.error("Error getting metrics:", error);
    res.status(500).end("Error getting metrics");
  }
};
const metricsReset = async (req: Request, res: Response) => {
  try {
    // This would typically be protected in production
    const jobKeys = await getAllJobKeys();

    for (const key of jobKeys) {
      await redis.del(key);
    }

    // Clear result cache
    const resultKeys = await redis.keys("result:*");
    for (const key of resultKeys) {
      await redis.del(key);
    }

    res.json({
      message: "Stats reset successfully",
      deletedJobs: jobKeys.length,
      deletedResults: resultKeys.length,
    });
  } catch (error: any) {
    console.error("Error resetting stats:", error);
    res.status(500).json({
      error: "Failed to reset stats",
      message: error.message,
    });
  }
};

export { statsController, statsDetailed, metrics, metricsReset };
