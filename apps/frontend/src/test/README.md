# Test Configuration and Coverage

This directory contains all test files for the CRM frontend application.

## Test Structure

- `setup.ts` - Global test configuration and mocks
- `**/*.test.tsx` - React component tests
- `**/*.test.ts` - Unit tests for utilities and stores
- `validation.test.ts` - Schema validation tests

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Coverage Thresholds

- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

## Test Utilities

The setup file provides:

- Jest DOM matchers
- Global test setup/teardown
- Mock implementations for browser APIs
- Cleanup utilities
