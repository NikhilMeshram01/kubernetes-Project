import express from 'express';
import request from 'supertest';
import { createRateLimiter } from '../../src/utils/rateLimiter.js';

describe('rateLimiter keying and headers', () => {
  it('uses email from body over IP for keying', async () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });
    const app = express();
    app.use(express.json());
    app.use(limiter);
    app.post('/login', (req, res) => res.json({ ok: true }));

    const agent = request(app);
    const email = 'user@example.com';
    const r1 = await agent.post('/login').send({ email });
    expect(r1.status).toBe(200);
    const r2 = await agent.post('/login').send({ email });
    expect(r2.status).toBe(429);
  });

  it('normalizes IPv6 loopback', async () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });
    const app = express();
    app.use(limiter);
    app.get('/ping', (req, res) => res.json({ ok: true }));

    const agent = request(app);
    const r1 = await agent.get('/ping').set('X-Forwarded-For', '::1');
    expect(r1.status).toBe(200);
    const r2 = await agent.get('/ping').set('X-Forwarded-For', '::1');
    expect(r2.status).toBe(429);
  });

  it('sets standard headers and omits legacy headers', async () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1, message: 'Too many' });
    const app = express();
    app.use(limiter);
    app.get('/ping', (req, res) => res.json({ ok: true }));
    const agent = request(app);
    await agent.get('/ping');
    const blocked = await agent.get('/ping');
    expect(blocked.headers['ratelimit-policy']).toBeDefined();
    expect(blocked.headers['x-ratelimit-limit']).toBeUndefined();
    expect(blocked.body.message).toBe('Too many');
  });
});
