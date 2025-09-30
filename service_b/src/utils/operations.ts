import bcrypt from "bcryptjs";

// Define input and output interfaces
interface PrimeCalculationInput {
  max?: number;
}

interface PrimeCalculationOutput {
  primes: number[];
  count: number;
  max: number;
}

interface BcryptHashInput {
  password?: string;
  rounds?: number;
}

interface BcryptHashOutput {
  hash: string;
  rounds: number;
  passwordLength: number;
}

interface ArraySortInput {
  size?: number;
}

interface ArraySortOutput {
  size: number;
  min?: number | undefined; // Explicitly include undefined
  max?: number | undefined; // Explicitly include undefined
  median?: number | undefined; // Explicitly include undefined
}

// Define operation types
export type OperationType = "prime-calculation" | "bcrypt-hash" | "array-sort";

interface Operation {
  (data: any): Promise<any>;
}

// Define operations map with proper typing
export const operations: Record<OperationType, Operation> = {
  "prime-calculation": async (
    data: PrimeCalculationInput
  ): Promise<PrimeCalculationOutput> => {
    const max = data.max ?? 100000;
    const primes: number[] = [];

    for (let i = 2; i <= max; i++) {
      let isPrime = true;
      for (let j = 2; j <= Math.sqrt(i); j++) {
        if (i % j === 0) {
          isPrime = false;
          break;
        }
      }
      if (isPrime) {
        primes.push(i);
      }
    }

    return {
      primes: primes.slice(-10), // Return last 10 primes to avoid huge responses
      count: primes.length,
      max,
    };
  },

  "bcrypt-hash": async (data: BcryptHashInput): Promise<BcryptHashOutput> => {
    const password = data.password ?? "default-password";
    const rounds = data.rounds ?? 10;

    const hash = await bcrypt.hash(password, rounds);

    return {
      hash,
      rounds,
      passwordLength: password.length,
    };
  },

  "array-sort": async (data: ArraySortInput): Promise<ArraySortOutput> => {
    const size = data.size ?? 100000;
    const array: number[] = [];

    // Generate random array
    for (let i = 0; i < size; i++) {
      array.push(Math.floor(Math.random() * 1000000));
    }

    // Sort array (CPU intensive)
    array.sort((a, b) => a - b);

    return {
      size,
      min: array.length > 0 ? array[0] : undefined,
      max: array.length > 0 ? array[array.length - 1] : undefined,
      median:
        array.length > 0 ? array[Math.floor(array.length / 2)] : undefined,
    };
  },
};
