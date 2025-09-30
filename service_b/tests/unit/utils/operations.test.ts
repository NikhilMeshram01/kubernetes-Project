import { operations } from '../../../src/utils/operations';

// Mock bcryptjs to avoid heavy hashing
jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: {
    hash: jest.fn(async (password: string, rounds: number) => `hash(${password})::${rounds}`),
  },
}));

describe('operations', () => {
  describe('prime-calculation', () => {
    it('calculates primes up to max and returns summary', async () => {
      const result = await operations['prime-calculation']({ max: 30 });
      expect(result.max).toBe(30);
      expect(result.count).toBeGreaterThan(0);
      expect(Array.isArray(result.primes)).toBe(true);
      expect(result.primes[result.primes.length - 1]).toBe(29);
    });
  });

  describe('bcrypt-hash', () => {
    it('hashes password with specified rounds and returns metadata', async () => {
      const result = await operations['bcrypt-hash']({ password: 'secret', rounds: 8 });
      expect(result.hash).toBe('hash(secret)::8');
      expect(result.rounds).toBe(8);
      expect(result.passwordLength).toBe(6);
    });

    it('uses defaults when input is missing', async () => {
      const result = await operations['bcrypt-hash']({});
      expect(result.hash).toBeDefined();
      expect(result.rounds).toBe(10);
      expect(result.passwordLength).toBe('default-password'.length);
    });
  });

  describe('array-sort', () => {
    const originalRandom = Math.random;
    afterEach(() => {
      Math.random = originalRandom;
    });

    it('generates, sorts array, and returns stats', async () => {
      let i = 0;
      const values = [0.9, 0.1, 0.5, 0.3, 0.7, 0.2, 0.8, 0.4, 0.6, 0.0];
      Math.random = () => values[i++ % values.length];

      const result = await operations['array-sort']({ size: 10 });
      expect(result.size).toBe(10);
      expect(result.min).toBeDefined();
      expect(result.max).toBeDefined();
      expect(result.median).toBeDefined();
      expect((result.min as number) <= (result.median as number)).toBe(true);
      expect((result.median as number) <= (result.max as number)).toBe(true);
    });
  });
});


