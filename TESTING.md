# CRM SaaS Testing Documentation

## Overview

This document describes the comprehensive testing strategy implemented for the CRM SaaS application, covering unit tests, integration tests, end-to-end tests, and automated CI/CD testing.

## Test Suite Components

### 1. Unit Tests

**Location**: `apps/frontend/src/__tests__/`

**Framework**: Vitest with React Testing Library

**Coverage**:

- Component rendering and behavior
- User interactions (clicks, form submissions)
- State management (Zustand stores)
- Utility functions and helpers

**Key Test Files**:

- `Dashboard.test.tsx` - Dashboard component tests
- `Contacts.test.tsx` - Contacts management tests
- `test-utils.tsx` - Shared testing utilities and mocks

**Running Unit Tests**:

```powershell
# Windows PowerShell
cd apps\frontend
npm run test

# With coverage
npm run test:coverage
```

### 2. Integration Tests

**Location**: `services/api-gateway/tests/integration/`

**Framework**: Vitest with Supertest

**Coverage**:

- API endpoint functionality
- Database operations
- Authentication and authorization
- Error handling and validation

**Key Test Files**:

- `integration.test.ts` - Comprehensive API testing

**Running Integration Tests**:

```powershell
cd services\api-gateway
npm run test:integration
```

### 3. End-to-End Tests

**Location**: `apps/frontend/e2e/`

**Framework**: Playwright

**Coverage**:

- Complete user workflows
- Multi-browser compatibility
- Mobile responsiveness
- Cross-platform testing

**Key Test Files**:

- `auth.spec.ts` - Authentication flows
- `dashboard.spec.ts` - Dashboard navigation and features
- `contacts.spec.ts` - Contact management workflows

**Running E2E Tests**:

```powershell
cd apps\frontend
npm run e2e
```

## Test Execution

### Automated Test Runner

Use the comprehensive test runner script for coordinated test execution:

```powershell
# Run all tests
.\scripts\run-tests.ps1

# Run specific test types
.\scripts\run-tests.ps1 -Unit
.\scripts\run-tests.ps1 -Integration
.\scripts\run-tests.ps1 -E2E

# Generate coverage report
.\scripts\run-tests.ps1 -Coverage

# Show help
.\scripts\run-tests.ps1 -Help
```

### Manual Test Execution

**Frontend Unit Tests**:

```powershell
cd apps\frontend
npm run test              # Watch mode
npm run test:run          # Single run
npm run test:coverage     # With coverage
```

**Backend Tests**:

```powershell
cd services\api-gateway
npm test                  # Unit tests
npm run test:integration  # Integration tests
```

**E2E Tests**:

```powershell
cd apps\frontend
npx playwright install    # Install browsers
npm run e2e               # Run all E2E tests
npm run e2e:headed       # Run with browser UI
```

## Test Configuration

### Vitest Configuration

**File**: `vite.config.ts`

Key settings:

- Test environment: jsdom
- Global test functions enabled
- Coverage threshold: 80%
- Coverage provider: v8
- Exclude patterns for non-testable files

### Playwright Configuration

**File**: `apps/frontend/playwright.config.ts`

Key settings:

- Multi-browser testing (Chromium, Firefox, WebKit)
- Mobile Chrome testing
- Automatic test server startup
- Screenshot and video recording on failure
- Retry logic for flaky tests

### Coverage Settings

**Thresholds**:

- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

**Coverage Reports**:

- HTML: `apps/frontend/coverage/index.html`
- JSON: `apps/frontend/coverage/coverage.json`
- Text: Console output

## Mock Strategy

### API Mocking

**Unit Tests**: Use Vitest's `vi.mock()` and `vi.stubGlobal()` for fetch API

**E2E Tests**: Real API calls against test database

**Integration Tests**: MongoDB Memory Server for isolated database testing

### Component Mocking

**Authentication**: Mock Zustand auth store with test data

**Router**: Mock React Router with MemoryRouter for isolated component testing

**External Services**: Mock third-party integrations and APIs

## CI/CD Integration

### GitHub Actions Workflow

**File**: `.github/workflows/ci.yml`

**Test Stages**:

1. Dependency installation
2. Linting and type checking
3. Unit test execution
4. Integration test execution (with Docker MongoDB)
5. E2E test execution
6. Coverage reporting
7. Security audit

**Triggered by**:

- Pull requests to main/develop
- Pushes to main branch
- Scheduled daily runs

### Environment Variables

**Test Environment Variables**:

```
NODE_ENV=test
DATABASE_URL=mongodb://localhost:27017/test_crm
JWT_SECRET=test-jwt-secret-key
MONGO_TEST_USER=testuser
MONGO_TEST_PASSWORD=generated-secure-password
```

## Best Practices

### Test Writing Guidelines

1. **Arrange-Act-Assert Pattern**: Structure tests clearly
2. **Descriptive Test Names**: Use "should do X when Y" format
3. **Isolated Tests**: Each test should be independent
4. **Mock External Dependencies**: Avoid flaky tests from external services
5. **Test Edge Cases**: Cover error conditions and boundary cases

### Performance Considerations

1. **Parallel Execution**: Tests run in parallel for faster execution
2. **Selective Running**: Use file patterns to run specific test suites
3. **Test Data Management**: Clean up test data between runs
4. **Resource Management**: Properly close database connections and cleanup

### Security Testing

1. **Authentication Tests**: Verify JWT token handling
2. **Authorization Tests**: Test role-based access control
3. **Input Validation**: Test XSS and injection prevention
4. **CORS Configuration**: Verify cross-origin request handling

## Troubleshooting

### Common Issues

**MongoDB Connection Issues**:

- Ensure Docker is running
- Check port 27017 availability
- Verify MongoDB container status

**Playwright Browser Issues**:

- Run `npx playwright install` to install browsers
- Check system dependencies for headless browsers
- Verify display settings for headed mode

**Test Timeouts**:

- Increase timeout values in test configuration
- Check for hanging promises or infinite loops
- Verify async/await usage

### Debug Commands

```powershell
# Run tests in debug mode
npm run test -- --reporter=verbose

# Run specific test file
npm run test -- Dashboard.test.tsx

# Run E2E tests with browser UI
npm run e2e:headed

# Generate detailed coverage report
npm run test:coverage -- --reporter=html
```

## Metrics and Reporting

### Coverage Metrics

Current coverage targets:

- Unit Tests: 80% minimum coverage
- Integration Tests: API endpoint coverage
- E2E Tests: Critical user journey coverage

### Test Reports

**Coverage Reports**: Generated in `coverage/` directory

**Test Results**: JUnit XML format for CI/CD integration

**Performance Metrics**: Test execution time tracking

**Failure Analysis**: Detailed error reporting with stack traces

## Future Enhancements

### Planned Improvements

1. **Visual Regression Testing**: Screenshot comparison for UI changes
2. **Load Testing**: Performance testing for API endpoints
3. **Accessibility Testing**: Automated a11y testing integration
4. **Cross-browser Matrix**: Extended browser compatibility testing
5. **Mobile Testing**: Enhanced mobile device coverage

### Monitoring Integration

1. **Test Analytics**: Track test execution trends
2. **Flaky Test Detection**: Identify and fix unreliable tests
3. **Performance Monitoring**: Monitor test execution performance
4. **Alert System**: Notifications for test failures

This comprehensive testing strategy ensures high code quality, reliable deployments, and confidence in the CRM SaaS application's functionality across all environments.
