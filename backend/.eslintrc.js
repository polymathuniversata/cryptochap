module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    node: true,
    es6: true,
  },
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',

    // General rules
    'no-console': 'error', // Prevent console statements in production
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',

    // Security rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js'],
};