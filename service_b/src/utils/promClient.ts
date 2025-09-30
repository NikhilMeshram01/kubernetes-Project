import client from 'prom-client';

// Prometheus metrics
export const register = new client.Registry();
// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics
export const jobsProcessedTotal = new client.Counter({
  name: 'worker_jobs_processed_total',
  help: 'Total number of jobs processed',
  labelNames: ['job_type', 'status'],
  registers: [register],
});
export const jobProcessingTimeSeconds = new client.Histogram({
  name: 'worker_job_processing_time_seconds',
  help: 'Time spent processing jobs in seconds',
  labelNames: ['job_type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
  registers: [register],
});
export const jobErrorsTotal = new client.Counter({
  name: 'worker_job_errors_total',
  help: 'Total number of job processing errors',
  labelNames: ['error_type'],
  registers: [register],
});
export const queueLength = new client.Gauge({
  name: 'worker_queue_length',
  help: 'Current length of the job queue',
  registers: [register],
});

register.registerMetric(jobErrorsTotal);
register.registerMetric(jobsProcessedTotal);
register.registerMetric(jobProcessingTimeSeconds);
register.registerMetric(queueLength);
