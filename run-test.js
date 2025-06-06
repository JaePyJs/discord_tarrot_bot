const { runCLI } = require('jest');
const path = require('path');

const config = {
  rootDir: __dirname,
  testMatch: ['<rootDir>/simple.test.js'],
  verbose: true,
  testEnvironment: 'node',
  runInBand: true,
  forceExit: true,
  detectOpenHandles: true,
  silent: false,
  testPathIgnorePatterns: ['/node_modules/'],
};

runCLI({
  config: JSON.stringify(config),
  runInBand: true,
  silent: false,
}, [__dirname])
  .then(({ results }) => {
    console.log('Test Results:', results);
    if (results.numFailedTests > 0) {
      console.error('Tests failed');
      process.exit(1);
    } else {
      console.log('All tests passed');
      process.exit(0);
    }
  })
  .catch((error) => {
    console.error('Test error:', error);
    process.exit(1);
  });
