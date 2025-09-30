import request from 'supertest';
import app from '../../src/app.js';

describe('GET /health headers', () => {
  it('responds with application/json content-type', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});
