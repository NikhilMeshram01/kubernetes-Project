import request from 'supertest';
import app from '../../src/app.js';

describe('GET /health', () => {
  it('returns healthy status with timestamp and service name', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'healthy',
        service: 'Service_A : job-submitter',
      })
    );
    expect(typeof response.body.timestamp).toBe('string');
  });
});
