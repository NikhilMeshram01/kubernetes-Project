import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  // 1️⃣ Ignore non-source folders and files
  {
    ignores: [
      'node_modules',
      '.next',
      'dist',
      'build',
      '__mocks__',
      'tests',
      '*.config.js',
      '*.config.mjs',
      'babel.config.js',
      'jest.config.js',
      'jest.setup.js',
      'postcss.config.js',
      'tailwind.config.js',
    ],
  },

  // 2️⃣ Base JS rules
  js.configs.recommended,

  // 3️⃣ TypeScript + React rules for source files
  {
    files: ['app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        jsxRuntime: 'automatic', // <--- this tells ESLint to not require React import
      },
      globals: globals.browser,
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      'no-unused-vars': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn'],
      'no-console': 'warn',
      'react/prop-types': 'off',
    },
  },

  // 4️⃣ Optional: JS files in src/app (if any)
  {
    files: ['app/**/*.{js,jsx}', 'src/**/*.{js,jsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { react: reactPlugin, 'react-hooks': reactHooks },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'warn',
      'react/prop-types': 'off',
    },
  },
];
