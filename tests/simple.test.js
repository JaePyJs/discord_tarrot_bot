const { test, expect } = require('@jest/globals');

// Simple test to verify Jest is working
test('should pass a simple test', () => {
  console.log('This is a test message');
  expect(1 + 1).toBe(2);
});

test('should fail intentionally', () => {
  console.log('This test will fail');
  expect(1).toBe(2);
});
