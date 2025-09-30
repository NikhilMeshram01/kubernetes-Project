/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/tests/unit', '<rootDir>/tests/integration'],
    transform: {
        '^.+\\.(ts|tsx)$': ['babel-jest', { configFile: './babel.config.cjs' }],
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    extensionsToTreatAsEsm: ['.ts'],
    testMatch: ['**/?(*.)+(spec|test).ts'],
    collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/server.ts'],
};


