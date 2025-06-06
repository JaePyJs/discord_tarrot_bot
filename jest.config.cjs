module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.js', '**/test-*.js', '**/*.spec.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
  ],
  verbose: true,
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: true,
  // Use this for ES modules if needed
  // transform: {}
};
