import { metricController } from '../../../src/controllers/workerControllers';

jest.mock('../../../src/configs/redis', () => ({
  __esModule: true,
  default: { llen: jest.fn(async () => 5) },
}));

const metricsText = '# HELP some_metric\n# TYPE some_metric counter\nsome_metric 1\n';
jest.mock('../../../src/utils/promClient', () => ({
  __esModule: true,
  queueLength: { set: jest.fn() },
  register: { contentType: 'text/plain; version=0.0.4', metrics: jest.fn(async () => metricsText) },
}));

function createRes() {
  const res: any = {};
  res.set = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
}

describe('metricController', () => {
  it('updates queue length and responds with metrics', async () => {
    const req: any = {};
    const res = createRes();

    await metricController(req as any, res as any);

    const redis = (await import('../../../src/configs/redis')).default as any;
    const { queueLength, register } = await import('../../../src/utils/promClient');

    expect(redis.llen).toHaveBeenCalledWith('job-queue');
    expect(queueLength.set).toHaveBeenCalledWith(5);
    expect(res.set).toHaveBeenCalledWith('Content-Type', register.contentType);
    expect(res.end).toHaveBeenCalledWith(metricsText);
  });
});


