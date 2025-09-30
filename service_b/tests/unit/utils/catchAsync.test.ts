import catchAsync from '../../../src/utils/catchAsync';

function createReqResNext() {
  const req: any = {};
  const res: any = {};
  const next = jest.fn();
  return { req, res, next };
}

describe('catchAsync', () => {
  it('calls next with error when async throws', async () => {
    const { req, res, next } = createReqResNext();
    const error = new Error('boom');

    const handler = catchAsync(async () => {
      throw error;
    });

    await handler(req as any, res as any, next as any);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('does not call next on success', async () => {
    const { req, res, next } = createReqResNext();
    const handler = catchAsync(async () => {
      return;
    });

    await handler(req as any, res as any, next as any);
    expect(next).not.toHaveBeenCalled();
  });
});


