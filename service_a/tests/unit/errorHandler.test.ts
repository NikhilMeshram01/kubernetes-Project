import { AppError, globalErrorHandler } from '../../src/utils/errorHandler.js';
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

describe('globalErrorHandler', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('returns detailed error in development', () => {
    process.env.NODE_ENV = 'development';
    const res = mockRes();
    const err = new AppError('Bad thing', 400);
    // @ts-ignore
    globalErrorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'fail', message: 'Bad thing' })
    );
  });

  it('returns generic message for non-operational errors in production', () => {
    process.env.NODE_ENV = 'production';
    const res = mockRes();
    const err = new Error('Boom');
    // @ts-ignore
    globalErrorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'error', message: 'Something went wrong' })
    );
  });

  it('returns operational error message in production', () => {
    process.env.NODE_ENV = 'production';
    const res = mockRes();
    const err = new AppError('Bad input', 422);
    // @ts-ignore
    globalErrorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'fail', message: 'Bad input' })
    );
  });
});
