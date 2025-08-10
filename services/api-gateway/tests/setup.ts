import "jest";

// Global test setup
beforeAll(async () => {
  // Setup any global test configuration
});

afterAll(async () => {
  // Cleanup global resources
});

// Mock console.log in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
