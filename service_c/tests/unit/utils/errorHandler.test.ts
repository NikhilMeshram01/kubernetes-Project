import { AppError, globalErrorHandler } from '../../../../src/utils/errorHandler.js';

const sendJson = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('globalErrorHandler', () => {
  const oldEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = oldEnv;
    jest.resetModules();
  });

  it('returns detailed error in development', () => {
    process.env.NODE_ENV = 'development';
    const err = new AppError('fail message', 400);
    const req = {} as any;
    const res = sendJson();

    globalErrorHandler(err as any, req, res, (() => {}) as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.status).toBe('fail');
    expect(body.message).toBe('fail message');
    expect(body.stack).toBeDefined();
  });

  it('handles operational errors in production', () => {
    process.env.NODE_ENV = 'production';
    const err = new AppError('not found', 404);
    const res = sendJson();

    globalErrorHandler(err as any, {} as any, res, (() => {}) as any);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ status: 'fail', message: 'not found' });
  });

  it('handles non-operational errors as 500 in production', () => {
    process.env.NODE_ENV = 'production';
    const err: any = new Error('oops');
    err.isOperational = false;
    const res = sendJson();

    globalErrorHandler(err, {} as any, res, (() => {}) as any);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ status: 'error', message: 'Something went wrong' });
  });
});


