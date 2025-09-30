process.env.NODE_ENV = 'test';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
process.env.JWT_ACCESS_SECRET_KEY = 'test-access-secret';
process.env.JWT_REFRESH_SECRET_KEY = 'test-refresh-secret';
process.env.REDIS_PASSWORD = 'test';
process.env.REDIS_HOST = '127.0.0.1';
process.env.REDIS_PORT = '6379';
process.env.MINIO_ENDPOINT = 'localhost';
process.env.MINIO_PORT = '9000';
process.env.MINIO_USE_SSL = 'false';
process.env.MINIO_ACCESS_KEY = 'minio';
process.env.MINIO_SECRET_KEY = 'miniosecret';
process.env.MINIO_BUCKET = 'test-bucket';

// Mock ioredis globally to avoid real connections
jest.mock('ioredis', () => {
  const EventEmitter = require('events');
  class MockRedis extends EventEmitter {
    constructor() {
      super();
      this.storage = new Map();
      this.hashes = new Map();
      setImmediate(() => this.emit('connect'));
    }
    ping() {
      return Promise.resolve('PONG');
    }
    quit() {
      return Promise.resolve();
    }
    lpush(key, value) {
      const arr = this.storage.get(key) || [];
      arr.unshift(value);
      this.storage.set(key, arr);
      return Promise.resolve(arr.length);
    }
    llen(key) {
      const arr = this.storage.get(key) || [];
      return Promise.resolve(arr.length);
    }
    hset(key, obj) {
      const map = this.hashes.get(key) || {};
      Object.assign(map, obj);
      this.hashes.set(key, map);
      return Promise.resolve(1);
    }
    hgetall(key) {
      return Promise.resolve(this.hashes.get(key) || {});
    }
    get(key) {
      return Promise.resolve(this.storage.get(key) || null);
    }
    set(key, value) {
      this.storage.set(key, value);
      return Promise.resolve('OK');
    }
  }
  return { Redis: MockRedis };
});
