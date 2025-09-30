import express from 'express';
import request from 'supertest';
import { createRateLimiter } from '../../src/utils/rateLimiter.js';

function buildApp(max: number) {
  const app = express();
  app.use(express.json());
  app.use(createRateLimiter({ windowMs: 60_000, max }));
  app.get('/ping', (req, res) => res.json({ ok: true }));
  return app;
}

describe('createRateLimiter', () => {
  it('allows up to max requests, then blocks with 429', async () => {
    const app = buildApp(2);
    const agent = request(app);

    const r1 = await agent.get('/ping');
    expect(r1.status).toBe(200);

    const r2 = await agent.get('/ping');
    expect(r2.status).toBe(200);

    const r3 = await agent.get('/ping');
    expect(r3.status).toBe(429);
    expect(r3.body).toEqual(
      expect.objectContaining({ success: false, message: expect.any(String) })
    );
  });
});
