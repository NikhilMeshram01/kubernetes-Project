import client from 'prom-client';

// Prometheus metrics
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics
const totalJobsSubmitted = new client.Counter({
  name: 'total_jobs_submitted',
  help: 'Total number of jobs submitted to the system',
  labelNames: ['job_type'],
  registers: [register],
});

const totalJobsCompleted = new client.Counter({
  name: 'total_jobs_completed',
  help: 'Total number of jobs completed',
  labelNames: ['job_type', 'status'],
  registers: [register],
});

const queueLength = new client.Gauge({
  name: 'queue_length',
  help: 'Current length of the job queue',
  registers: [register],
});

const averageProcessingTime = new client.Gauge({
  name: 'average_processing_time_seconds',
  help: 'Average processing time for completed jobs',
  labelNames: ['job_type'],
  registers: [register],
});

register.registerMetric(totalJobsSubmitted);
register.registerMetric(totalJobsCompleted);
register.registerMetric(queueLength);
register.registerMetric(averageProcessingTime);

export { register, totalJobsSubmitted, totalJobsCompleted, queueLength, averageProcessingTime };
