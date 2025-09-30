/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    transform: {
        '^.+\\.(ts|tsx)$': ['babel-jest', { presets: [['@babel/preset-env', { targets: { node: 'current' } }], '@babel/preset-typescript'] }],
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    extensionsToTreatAsEsm: ['.ts'],
    testMatch: ['**/?(*.)+(test|spec).ts'],
    moduleNameMapper: {
        // Allow importing ESM TS files that use .js extension in source
        '^(.*)\\.js$': '$1',
    },
};


