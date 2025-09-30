jest.unstable_mockModule('../../../../src/utils/jobsStats.js', () => ({
  getJobStats: jest.fn(async () => ({
    total: 1,
    queued: 0,
    processing: 0,
    completed: 1,
    failed: 0,
    byType: { email: 1 },
    processingTimes: {},
  })),
  getAllJobKeys: jest.fn(async () => ['job:1']),
  __esModule: true,
}));

jest.unstable_mockModule('../../../../src/configs/redis.js', () => ({
  default: {
    llen: jest.fn(async () => 3),
    hgetall: jest.fn(async () => ({ status: 'completed', type: 'email' })),
    keys: jest.fn(async () => ['job:1']),
    del: jest.fn(async () => 1),
  },
  __esModule: true,
}));

jest.unstable_mockModule('../../../../src/utils/promClient.js', () => ({
  register: { metrics: jest.fn(async () => 'metrics'), contentType: 'text/plain' },
  __esModule: true,
}));

describe('statControllers', () => {
  it('statsController returns stats json', async () => {
    const { statsController } = await import('../../../../src/controllers/statControllers.js');
    const req = {} as any;
    const res: any = { json: jest.fn() };
    await statsController(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.queueLength).toBe(3);
    expect(body.jobs.completed).toBe(1);
  });

  it('metrics returns prom metrics', async () => {
    const { metrics } = await import('../../../../src/controllers/statControllers.js');
    const req = {} as any;
    const res: any = { set: jest.fn(), end: jest.fn() };
    await metrics(req, res);
    expect(res.set).toHaveBeenCalledWith('Content-Type', 'text/plain');
    expect(res.end).toHaveBeenCalledWith('metrics');
  });

  it('metricsReset clears keys and returns counts', async () => {
    const { metricsReset } = await import('../../../../src/controllers/statControllers.js');
    const req = {} as any;
    const res: any = { json: jest.fn() };
    await metricsReset(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.message).toMatch(/Stats reset successfully/);
  });
});


