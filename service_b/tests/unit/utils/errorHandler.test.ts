import { AppError, globalErrorHandler } from '../../../src/utils/errorHandler';

jest.mock('../../../src/configs/configs', () => ({
  __esModule: true,
  NODE_ENV: 'test',
}));

function createRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('AppError', () => {
  it('sets status and statusCode correctly', () => {
    const err = new AppError('bad', 400);
    expect(err.statusCode).toBe(400);
    expect(err.status).toBe('fail');
    expect(err.isOperational).toBe(true);
  });
});

describe('globalErrorHandler', () => {
  it('returns sanitized response for operational errors', () => {
    const err = new AppError('bad', 400);
    const req: any = {};
    const res = createRes();
    const next = jest.fn();

    globalErrorHandler(err as any, req as any, res as any, next as any);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ status: 'fail', message: 'bad' });
  });

  it('returns generic response for non-operational errors', () => {
    const err: any = new Error('unexpected');
    err.isOperational = false;
    const req: any = {};
    const res = createRes();
    const next = jest.fn();

    globalErrorHandler(err, req as any, res as any, next as any);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ status: 'error', message: 'Something went wrong' });
  });
});


