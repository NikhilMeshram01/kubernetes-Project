import request from 'supertest';
import app from '../../src/app.js';
import redis from '../../src/configs/redis.js';

describe('GET /api/v1/job/status/:id', () => {
  // it('returns 404 for unknown job id', async () => {
  //   const response = await request(app).get('/api/v1/job/status/unknown');
  //   expect(response.status).toBe(404);
  //   expect(response.body).toEqual(
  //     expect.objectContaining({ status: 'fail', message: 'Job not found' })
  //   );
  // });

  it('returns completed job with parsed result', async () => {
    const jobId = 'job-123';
    await (redis as any).hset(`job:${jobId}`, {
      status: 'completed',
      createdAt: new Date().toISOString(),
      type: 'prime-calculation',
      completedAt: new Date().toISOString(),
    });
    await (redis as any).set(`result:${jobId}`, JSON.stringify({ primes: [2, 3, 5] }));

    const response = await request(app).get(`/api/v1/job/status/${jobId}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        jobId,
        status: 'completed',
        type: 'prime-calculation',
        result: { primes: [2, 3, 5] },
      })
    );
  });
});
