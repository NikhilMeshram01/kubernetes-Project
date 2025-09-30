import * as jobsStats from '../../../../src/utils/jobsStats.js';

jest.unstable_mockModule('../../../../src/configs/redis.js', () => {
  const store: Record<string, any> = {
    'job:1': { status: 'completed', type: 'email', processingTime: '1.5' },
    'job:2': { status: 'failed', type: 'report', processingTime: '2.0' },
    'job:3': { status: 'completed', type: 'email', processingTime: '0.5' },
  };
  const keys = Object.keys(store);
  return {
    default: {
      keys: jest.fn(async (pattern: string) => (pattern === 'job:*' ? keys : [])),
      hgetall: jest.fn(async (key: string) => store[key] ?? {}),
      del: jest.fn(async () => 1),
      llen: jest.fn(async () => 0),
      quit: jest.fn(async () => undefined),
    },
    __esModule: true,
  };
});

describe('jobsStats', () => {
  it('computes totals and averages', async () => {
    const { getJobStats, getAllJobKeys } = await import('../../../../src/utils/jobsStats.js');
    const allKeys = await getAllJobKeys();
    expect(allKeys).toEqual(expect.arrayContaining(['job:1', 'job:2', 'job:3']));

    const stats = await getJobStats();
    expect(stats.total).toBe(3);
    expect(stats.completed).toBe(2);
    expect(stats.failed).toBe(1);
    expect(stats.byType.email).toBe(2);
    expect(stats.processingTimes.email.average).toBeCloseTo(1.0);
    expect(stats.processingTimes.email.count).toBe(2);
    expect(stats.processingTimes.email.min).toBeCloseTo(0.5);
    expect(stats.processingTimes.email.max).toBeCloseTo(1.5);
  });
});


