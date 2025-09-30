import { processJob } from '../../../src/utils/processJobs';

// Mock redis client used inside processJobs
jest.mock('../../../src/configs/redis', () => ({
  __esModule: true,
  default: {
    hset: jest.fn(async () => 1),
    set: jest.fn(async () => 'OK'),
  },
}));

// Mock prom metrics
jest.mock('../../../src/utils/promClient', () => ({
  __esModule: true,
  jobsProcessedTotal: { inc: jest.fn() },
  jobProcessingTimeSeconds: { observe: jest.fn() },
  jobErrorsTotal: { inc: jest.fn() },
}));

// Mock operations map
jest.mock('../../../src/utils/operations', () => ({
  __esModule: true,
  operations: {
    'prime-calculation': jest.fn(async () => ({ primes: [2, 3], count: 2, max: 3 })),
  },
}));

describe('processJob', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('processes a valid job, stores result, and updates metrics', async () => {
    const job = {
      id: '1',
      type: 'prime-calculation',
      data: { max: 10 },
    };

    await processJob(JSON.stringify(job));

    const redis = (await import('../../../src/configs/redis')).default as any;
    const { jobsProcessedTotal, jobProcessingTimeSeconds } = await import('../../../src/utils/promClient');
    const { operations } = await import('../../../src/utils/operations');

    expect(redis.hset).toHaveBeenCalledWith('job:1', expect.objectContaining({ status: 'processing' }));
    expect(operations['prime-calculation']).toHaveBeenCalledWith({ max: 10 });
    expect(redis.set).toHaveBeenCalledWith('result:1', expect.any(String), 'EX', 3600);
    expect(redis.hset).toHaveBeenCalledWith('job:1', expect.objectContaining({ status: 'completed' }));
    expect(jobsProcessedTotal.inc).toHaveBeenCalledWith({ job_type: 'prime-calculation', status: 'completed' });
    expect(jobProcessingTimeSeconds.observe).toHaveBeenCalledWith({ job_type: 'prime-calculation' }, expect.any(Number));
  });

  it('handles errors and updates failure metrics', async () => {
    const bad = { id: '2', type: 'unknown', data: {} } as any;
    await processJob(JSON.stringify(bad));

    const redis = (await import('../../../src/configs/redis')).default as any;
    const { jobsProcessedTotal, jobErrorsTotal, jobProcessingTimeSeconds } = await import('../../../src/utils/promClient');

    expect(redis.hset).toHaveBeenCalledWith('job:2', expect.objectContaining({ status: 'failed' }));
    expect(jobsProcessedTotal.inc).toHaveBeenCalledWith({ job_type: 'unknown', status: 'failed' });
    expect(jobErrorsTotal.inc).toHaveBeenCalledWith({ error_type: 'processing_error' });
    expect(jobProcessingTimeSeconds.observe).toHaveBeenCalledWith({ job_type: 'unknown' }, expect.any(Number));
  });
});


