import catchAsync from '../../../../src/utils/catchAsync.js';

describe('catchAsync', () => {
  it('calls next with error when promise rejects', async () => {
    const error = new Error('boom');
    const handler = catchAsync(async () => {
      throw error;
    });

    const req = {} as any;
    const res = {} as any;
    const next = jest.fn();

    await handler(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('does not call next with error when resolves', async () => {
    const handler = catchAsync(async () => {});
    const req = {} as any;
    const res = {} as any;
    const next = jest.fn();

    await handler(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });
});


