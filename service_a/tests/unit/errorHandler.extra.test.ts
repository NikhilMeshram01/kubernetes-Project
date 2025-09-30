import { globalErrorHandler } from '../../src/utils/errorHandler.js';
import type { Request, Response, NextFunction } from 'express';

function mockRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  // @ts-ignore
  res.json = jest.fn().mockReturnValue(res);
  return res as Response & { status: jest.Mock; json: jest.Mock };
}

const req = {} as Request;
const next = (() => {}) as NextFunction;

describe('globalErrorHandler defaults', () => {
  const originalEnv = process.env.NODE_ENV;
  beforeEach(() => {
    process.env.NODE_ENV = 'production';
  });
  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('defaults to 500/error when status fields are missing', () => {
    const res = mockRes();
    const err = new Error('Unknown');
    // @ts-ignore
    globalErrorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'error', message: 'Something went wrong' })
    );
  });

  it('operational 5xx reports status "error"', () => {
    const res = mockRes();
    const err: any = new Error('Server down');
    err.statusCode = 503;
    err.isOperational = true;
    err.status = 'error';
    // @ts-ignore
    globalErrorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'error', message: 'Server down' })
    );
  });
});
