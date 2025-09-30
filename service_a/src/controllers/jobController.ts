import { JOB_TYPES } from '../configs/constants.js';
import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import redis from '../configs/redis.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../utils/errorHandler.js';

export const submitController = catchAsync(async (req: Request, res: Response) => {
  const { jobType = 'prime-calculation', data = {} } = req.body;

  // Validate job type
  if (!(jobType in JOB_TYPES)) return new AppError('Invalid job type', 400);

  // Generate unique job ID
  const jobId = uuidv4();

  // Create job payload
  const job = {
    id: jobId,
    type: jobType,
    data: data,
    status: 'queued',
    createdAt: new Date().toISOString(),
    submittedBy: req.ip,
  };

  // Add job to Redis queue
  await redis.lpush('job-queue', JSON.stringify(job));

  // Store job details for status checking
  await redis.hset(`job:${jobId}`, {
    status: 'queued',
    createdAt: job.createdAt,
    type: jobType,
  });

  console.log(`Job submitted: ${jobId} (${jobType})`);

  res.status(201).json({
    jobId: jobId,
    status: 'queued',
    message: 'Job submitted successfully',
  });
});
export const statusController = catchAsync(async (req: Request, res: Response) => {
  const jobId = req.params.id;

  // Get job details from Redis
  const jobDetails = await redis.hgetall(`job:${jobId}`);

  if (!jobDetails || Object.keys(jobDetails).length === 0)
    return new AppError('Job not found', 404);

  // Get result if completed
  let result = null;
  if (jobDetails.status === 'completed') {
    const resultData = await redis.get(`result:${jobId}`);
    if (resultData) {
      result = JSON.parse(resultData);
    }
  }

  res.json({
    jobId: jobId,
    status: jobDetails.status,
    type: jobDetails.type,
    createdAt: jobDetails.createdAt,
    completedAt: jobDetails.completedAt || null,
    result: result,
  });
});
// export const availableJobTypes = (req: Request, res: Response) => {
//   res.json(JOB_TYPES);
// };
// export const getQueueLength = catchAsync(async (req: Request, res: Response) => {
//   const queueLength = await redis.llen('job-queue');
//   res.json({
//     queueLength: queueLength,
//     timestamp: new Date().toISOString(),
//   });
// });
