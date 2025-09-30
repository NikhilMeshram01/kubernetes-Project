jest.unstable_mockModule('../../../../src/utils/promClient.js', () => {
  const gauge = () => ({ set: jest.fn() });
  const counter = () => ({ inc: jest.fn() });
  return {
    queueLength: gauge(),
    averageProcessingTime: gauge(),
    totalJobsCompleted: counter(),
    register: { metrics: jest.fn(async () => ''), contentType: 'text/plain' },
    __esModule: true,
  };
});

jest.unstable_mockModule('../../../../src/configs/redis.js', () => ({
  default: { llen: jest.fn(async () => 5) },
  __esModule: true,
}));

jest.unstable_mockModule('../../../../src/utils/jobsStats.js', () => ({
  getJobStats: jest.fn(async () => ({
    total: 2,
    queued: 0,
    processing: 0,
    completed: 2,
    failed: 0,
    byType: { email: 2 },
    processingTimes: { email: { average: 1, count: 2, min: 1, max: 1 } },
  })),
  __esModule: true,
}));

describe('updateMetrics', () => {
  it('updates gauges and counters', async () => {
    const { updateMetrics } = await import('../../../../src/utils/updateMetrics.js');
    const prom = await import('../../../../src/utils/promClient.js');
    await updateMetrics();
    expect(prom.queueLength.set).toHaveBeenCalledWith(5);
    expect(prom.totalJobsCompleted.inc).toHaveBeenCalledWith({ job_type: 'email', status: 'completed' }, 2);
  });
});


