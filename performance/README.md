# Performance Testing Guide

## Overview

This document provides comprehensive guidelines for performance testing the CRM SaaS platform using K6 and Artillery frameworks.

## Quick Start

### Windows

```bash
# Run all performance tests
npm run perf:test:windows

# Or run the batch file directly
./performance/run-performance-tests.bat
```

### Linux/macOS

```bash
# Run all performance tests
npm run perf:test

# Run only K6 tests
npm run perf:test:k6

# Run only Artillery tests
npm run perf:test:artillery
```

## Prerequisites

### Required Tools

1. **K6** - Load testing tool

   - Windows: `winget install k6` or download from [GitHub](https://github.com/grafana/k6/releases)
   - macOS: `brew install k6`
   - Linux: Follow instructions at [k6.io](https://k6.io/docs/getting-started/installation/)

2. **Artillery** - Performance testing toolkit

   ```bash
   npm install -g artillery
   ```

3. **Node.js** >= 18.0.0
4. **curl** - For server health checks

### Optional Installation

```bash
# Install performance testing tools globally
npm run perf:install
```

## Test Structure

### K6 Tests (`/performance/k6-scripts/`)

#### 1. API Load Test (`api-load-test.js`)

- **Purpose**: Tests API endpoints under realistic load conditions
- **Stages**:
  - Ramp up: 0→10→50→100 users over 15 minutes
  - Sustain: 100 users for 10 minutes
  - Ramp down: 100→0 users over 5 minutes
- **Metrics**: Response times, throughput, error rates
- **Thresholds**:
  - 95% of requests < 2000ms
  - Error rate < 5%
  - 99% availability

#### 2. Stress Test (`stress-test.js`)

- **Purpose**: Determines system breaking point
- **Stages**: Progressive load increase to 500 concurrent users
- **Duration**: 20 minutes total
- **Focus**: System stability under extreme load

### Artillery Tests (`/performance/artillery/`)

#### 1. API Test (`api-test.yml`)

- **Purpose**: HTTP API performance testing
- **Scenarios**: Authentication, CRUD operations, search
- **Load**: 50 arrivals/second for 5 minutes
- **Metrics**: Response times, status codes, custom metrics

#### 2. Frontend Test (`frontend-test.yml`)

- **Purpose**: Frontend application performance
- **Scenarios**: Page loads, user interactions, static assets
- **Load**: 20 arrivals/second for 3 minutes
- **Metrics**: Page load times, asset loading

## Running Tests

### Individual Test Execution

#### K6 Tests

```bash
# API Load Test
k6 run performance/k6-scripts/api-load-test.js

# Stress Test
k6 run performance/k6-scripts/stress-test.js

# With custom options
k6 run --vus 50 --duration 5m performance/k6-scripts/api-load-test.js
```

#### Artillery Tests

```bash
# API Performance Test
artillery run performance/artillery/api-test.yml

# Frontend Performance Test
artillery run performance/artillery/frontend-test.yml

# With custom target
artillery run performance/artillery/api-test.yml -t http://localhost:4000
```

### Automated Test Suite

The automated test runner (`run-performance-tests.sh/bat`) provides:

1. **Dependency Checking**: Verifies K6 and Artillery installation
2. **Server Management**: Starts API and frontend servers automatically
3. **Test Execution**: Runs all performance tests in sequence
4. **Report Generation**: Creates HTML reports and JSON outputs
5. **Cleanup**: Stops test servers after completion

#### Script Options

```bash
# Run all tests (default)
./performance/run-performance-tests.sh

# Run only K6 tests
./performance/run-performance-tests.sh --k6

# Run only Artillery tests
./performance/run-performance-tests.sh --artillery

# Skip server startup (use existing servers)
./performance/run-performance-tests.sh --skip-servers

# Show help
./performance/run-performance-tests.sh --help
```

## Report Analysis

### K6 Reports

Located in `performance/reports/`:

- `k6-load-test.json` - Detailed load test metrics
- `k6-stress-test.json` - Stress test results

Key metrics to monitor:

- **http_req_duration**: Response time percentiles
- **http_reqs**: Request rate (RPS)
- **http_req_failed**: Error rate percentage
- **vus**: Virtual users over time
- **iterations**: Completed test iterations

### Artillery Reports

Located in `performance/reports/`:

- `artillery-api-report.html` - Interactive API test report
- `artillery-frontend-report.html` - Frontend performance report
- `artillery-api-report.json` - Raw API test data
- `artillery-frontend-report.json` - Raw frontend data

Key metrics to monitor:

- **Response Times**: Mean, median, p95, p99
- **Status Codes**: Success/error distribution
- **Requests per Second**: Throughput metrics
- **Scenarios**: Individual scenario performance

## Performance Thresholds

### API Performance Standards

- **Response Time**: 95% of requests < 2 seconds
- **Availability**: 99.9% uptime
- **Error Rate**: < 1% for normal operations, < 5% under load
- **Throughput**: Minimum 100 RPS sustained

### Frontend Performance Standards

- **Page Load**: < 3 seconds for initial load
- **Time to Interactive**: < 5 seconds
- **Largest Contentful Paint**: < 2.5 seconds
- **Cumulative Layout Shift**: < 0.1

## Troubleshooting

### Common Issues

#### 1. Connection Refused

```
Error: Connection refused to localhost:4000
```

**Solution**: Ensure API server is running

```bash
cd services/api-gateway
npm run dev
```

#### 2. K6 Not Found

```
k6: command not found
```

**Solution**: Install K6 or use full path

```bash
# Check installation
which k6
# Or install
npm run perf:install
```

#### 3. High Error Rates

**Causes**:

- Server overload
- Database connection limits
- Memory/CPU constraints

**Solutions**:

- Reduce concurrent users
- Increase server resources
- Optimize database queries
- Add connection pooling

#### 4. Artillery Installation Issues

```bash
# Clear npm cache
npm cache clean --force

# Reinstall Artillery
npm uninstall -g artillery
npm install -g artillery
```

### Performance Optimization Tips

#### Backend Optimization

1. **Database Indexing**: Ensure proper indexes on queried fields
2. **Connection Pooling**: Configure MongoDB connection limits
3. **Caching**: Implement Redis for frequently accessed data
4. **Request Validation**: Use efficient validation libraries
5. **Compression**: Enable gzip compression

#### Frontend Optimization

1. **Code Splitting**: Implement route-based code splitting
2. **Asset Optimization**: Compress images and minimize bundles
3. **CDN Usage**: Serve static assets from CDN
4. **Lazy Loading**: Load components on demand
5. **Caching Strategies**: Implement proper browser caching

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Performance Tests
on:
  schedule:
    - cron: "0 2 * * *" # Daily at 2 AM
  workflow_dispatch:

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Install performance tools
        run: npm run perf:install

      - name: Run performance tests
        run: npm run perf:test

      - name: Upload reports
        uses: actions/upload-artifact@v4
        with:
          name: performance-reports
          path: performance/reports/
```

### Monitoring Integration

#### Metrics Collection

- **Prometheus**: Export K6 metrics to Prometheus
- **Grafana**: Visualize performance trends
- **DataDog**: Real-time performance monitoring
- **New Relic**: Application performance monitoring

#### Alerting

Set up alerts for:

- Response time degradation > 20%
- Error rate increase > 2%
- Throughput decrease > 15%
- Availability drop < 99%

## Best Practices

### Test Design

1. **Realistic Scenarios**: Mirror actual user behavior
2. **Progressive Loading**: Gradual ramp-up/down
3. **Data Variety**: Use diverse test data sets
4. **Environment Consistency**: Standardize test environments
5. **Baseline Establishment**: Record performance baselines

### Test Execution

1. **Regular Scheduling**: Run tests consistently
2. **Environment Isolation**: Dedicated performance environment
3. **Resource Monitoring**: Monitor system resources during tests
4. **Data Cleanup**: Clean test data between runs
5. **Result Comparison**: Compare against historical results

### Result Analysis

1. **Trend Analysis**: Monitor performance over time
2. **Correlation Analysis**: Link performance to code changes
3. **Threshold Monitoring**: Alert on threshold breaches
4. **Root Cause Analysis**: Investigate performance degradations
5. **Continuous Improvement**: Regular optimization cycles

## Support

For performance testing support:

1. Check troubleshooting section above
2. Review K6 documentation: https://k6.io/docs/
3. Review Artillery documentation: https://artillery.io/docs/
4. Open GitHub issue with test results and logs
5. Contact DevOps team for infrastructure concerns

---

**Last Updated**: 2024-01-20
**Version**: 1.0.0
