import request from 'supertest';
import app from '../../src/app.js';

describe('POST /api/v1/job/submit', () => {
  it('submits a job and returns 201 with jobId', async () => {
    const response = await request(app)
      .post('/api/v1/job/submit')
      .send({ jobType: 'prime-calculation', data: { n: 10 } });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        jobId: expect.any(String),
        status: 'queued',
        message: expect.any(String),
      })
    );
  });

  // it('rejects invalid jobType with 400', async () => {
  //   const response = await request(app)
  //     .post('/api/v1/job/submit')
  //     .send({ jobType: 'not-a-real-job' });
  //   expect(response.status).toBe(400);
  //   expect(response.body).toEqual(
  //     expect.objectContaining({ status: 'fail', message: 'Invalid job type' })
  //   );
  // });
});
