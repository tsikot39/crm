import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

// Custom metrics
export const errorRate = new Rate("errors");

// Stress test configuration - High load testing
export const options = {
  stages: [
    // Stress test stages
    { duration: "1m", target: 50 }, // Ramp up to 50 users
    { duration: "2m", target: 100 }, // Ramp up to 100 users
    { duration: "3m", target: 200 }, // Ramp up to 200 users
    { duration: "5m", target: 300 }, // Stress test with 300 users
    { duration: "3m", target: 500 }, // Peak stress with 500 users
    { duration: "2m", target: 200 }, // Scale back down
    { duration: "1m", target: 0 }, // Ramp down to 0
  ],
  thresholds: {
    // More relaxed thresholds for stress testing
    http_req_duration: ["p(95)<2000"], // 95% of requests under 2 seconds
    http_req_failed: ["rate<0.10"], // Error rate under 10%
    errors: ["rate<0.15"], // Custom error rate under 15%
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";

export function setup() {
  console.log("Starting stress test setup...");

  // Health check before stress testing
  const healthResponse = http.get(`${BASE_URL}/api/health`);

  if (healthResponse.status !== 200) {
    console.error("Health check failed. Aborting stress test.");
    return null;
  }

  console.log("System is healthy. Starting stress test...");
  return { healthy: true };
}

export default function () {
  // Stress test scenarios with higher frequency
  const scenarios = [rapidAuthTest, rapidApiCallsTest, concurrentDataTest];

  // Execute random scenario
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario();

  // Reduced sleep time for stress testing
  sleep(Math.random() * 1 + 0.5); // 0.5-1.5 seconds
}

function rapidAuthTest() {
  // Rapid authentication attempts
  const authPayload = JSON.stringify({
    email: "test@example.com",
    password: "password123",
  });

  const response = http.post(`${BASE_URL}/api/auth/login`, authPayload, {
    headers: { "Content-Type": "application/json" },
    tags: { name: "stress-auth" },
  });

  const success = check(response, {
    "stress auth status is 200 or 429": (r) =>
      r.status === 200 || r.status === 429,
    "stress auth response time < 3000ms": (r) => r.timings.duration < 3000,
  });

  errorRate.add(!success);
}

function rapidApiCallsTest() {
  // Multiple rapid API calls to test system limits
  const endpoints = ["/api/health", "/api/auth/verify", "/api/dashboard"];

  endpoints.forEach((endpoint) => {
    const response = http.get(`${BASE_URL}${endpoint}`, {
      headers:
        endpoint !== "/api/health"
          ? { Authorization: "Bearer invalid-token" }
          : {},
      tags: { name: `stress-${endpoint.split("/").pop()}` },
    });

    check(response, {
      [`${endpoint} responds quickly`]: (r) => r.timings.duration < 5000,
      [`${endpoint} doesn't crash`]: (r) => r.status < 500,
    });
  });
}

function concurrentDataTest() {
  // Simulate heavy data operations
  const token = "Bearer test-token"; // Using invalid token to test error handling

  const response = http.get(`${BASE_URL}/api/contacts?page=1&limit=100`, {
    headers: { Authorization: token },
    tags: { name: "stress-data" },
  });

  check(response, {
    "data endpoint handles load": (r) => r.timings.duration < 10000,
    "data endpoint responds": (r) => r.status > 0, // Any response is better than timeout
  });
}

export function teardown() {
  console.log(
    "Stress test completed. Review results for system breaking points."
  );
}
