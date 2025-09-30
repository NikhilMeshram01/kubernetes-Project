import dotenv from 'dotenv';
dotenv.config();

import express, { type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { globalErrorHandler } from './utils/errorHandler.js';
import redis from './configs/redis.js';
import serviceARoutes from './routes/jobRoutes.js';
import { apiLimiter } from './utils/rateLimiter.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(apiLimiter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Service_A : job-submitter',
  });
});

// routes
app.use('/api/v1/job', serviceARoutes);

// Error handling middleware
app.use(globalErrorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await redis.quit();
  process.exit(0);
});

export default app;
