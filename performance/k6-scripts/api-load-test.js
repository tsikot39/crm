import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

// Custom metrics
export const errorRate = new Rate("errors");

// Test configuration
export const options = {
  stages: [
    // Ramp-up: gradually increase load
    { duration: "2m", target: 10 }, // Ramp up to 10 users over 2 minutes
    { duration: "5m", target: 10 }, // Maintain 10 users for 5 minutes
    { duration: "2m", target: 50 }, // Ramp up to 50 users over 2 minutes
    { duration: "5m", target: 50 }, // Maintain 50 users for 5 minutes
    { duration: "2m", target: 100 }, // Ramp up to 100 users over 2 minutes
    { duration: "5m", target: 100 }, // Maintain 100 users for 5 minutes
    { duration: "2m", target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    // Performance thresholds
    http_req_duration: ["p(95)<500"], // 95% of requests must complete below 500ms
    http_req_failed: ["rate<0.05"], // Error rate must be below 5%
    errors: ["rate<0.1"], // Custom error rate below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";

// Test data
const testUsers = [
  { email: "test@example.com", password: "password123" },
  { email: "user1@example.com", password: "password123" },
  { email: "user2@example.com", password: "password123" },
];

let authToken = "";

export function setup() {
  // Setup phase: authenticate a user for authenticated endpoints
  console.log("Setting up test environment...");

  const loginResponse = http.post(
    `${BASE_URL}/api/auth/login`,
    {
      email: "test@example.com",
      password: "password123",
    },
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  if (loginResponse.status === 200) {
    const body = JSON.parse(loginResponse.body);
    authToken = body.data?.token || "";
    console.log("Authentication successful for setup");
  }

  return { authToken };
}

export default function (data) {
  // Test scenario: Mixed workload simulation
  const scenarios = [
    authenticationTest,
    dashboardTest,
    contactsTest,
    dealsTest,
    profileTest,
  ];

  // Randomly select a scenario to simulate realistic user behavior
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario(data);

  // Think time: simulate user reading/thinking
  sleep(Math.random() * 3 + 1); // 1-4 seconds
}

function authenticationTest(data) {
  const testUser = testUsers[Math.floor(Math.random() * testUsers.length)];

  // Test login endpoint
  const loginResponse = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify(testUser),
    {
      headers: { "Content-Type": "application/json" },
      tags: { name: "login" },
    }
  );

  const loginSuccess = check(loginResponse, {
    "login status is 200": (r) => r.status === 200,
    "login response time < 500ms": (r) => r.timings.duration < 500,
    "login contains token": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.token;
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!loginSuccess);

  if (loginResponse.status === 200) {
    // Test token verification
    const body = JSON.parse(loginResponse.body);
    const token = body.data.token;

    const verifyResponse = http.get(`${BASE_URL}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
      tags: { name: "verify-token" },
    });

    check(verifyResponse, {
      "token verification status is 200": (r) => r.status === 200,
      "token verification response time < 200ms": (r) =>
        r.timings.duration < 200,
    });
  }
}

function dashboardTest(data) {
  const token = data.authToken || authToken;

  if (!token) {
    console.log("No auth token available for dashboard test");
    return;
  }

  // Test dashboard endpoint
  const dashboardResponse = http.get(`${BASE_URL}/api/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
    tags: { name: "dashboard" },
  });

  check(dashboardResponse, {
    "dashboard status is 200": (r) => r.status === 200,
    "dashboard response time < 1000ms": (r) => r.timings.duration < 1000,
    "dashboard contains stats": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.stats;
      } catch {
        return false;
      }
    },
  });
}

function contactsTest(data) {
  const token = data.authToken || authToken;

  if (!token) {
    console.log("No auth token available for contacts test");
    return;
  }

  // Test contacts list endpoint
  const contactsResponse = http.get(
    `${BASE_URL}/api/contacts?page=1&limit=10`,
    {
      headers: { Authorization: `Bearer ${token}` },
      tags: { name: "contacts-list" },
    }
  );

  check(contactsResponse, {
    "contacts list status is 200": (r) => r.status === 200,
    "contacts list response time < 800ms": (r) => r.timings.duration < 800,
    "contacts list contains data": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && Array.isArray(body.data.contacts);
      } catch {
        return false;
      }
    },
  });

  // Test contact search
  const searchResponse = http.get(
    `${BASE_URL}/api/contacts?search=test&page=1&limit=5`,
    {
      headers: { Authorization: `Bearer ${token}` },
      tags: { name: "contacts-search" },
    }
  );

  check(searchResponse, {
    "contact search status is 200": (r) => r.status === 200,
    "contact search response time < 600ms": (r) => r.timings.duration < 600,
  });
}

function dealsTest(data) {
  const token = data.authToken || authToken;

  if (!token) {
    console.log("No auth token available for deals test");
    return;
  }

  // Test deals list endpoint
  const dealsResponse = http.get(`${BASE_URL}/api/deals?page=1&limit=10`, {
    headers: { Authorization: `Bearer ${token}` },
    tags: { name: "deals-list" },
  });

  check(dealsResponse, {
    "deals list status is 200": (r) => r.status === 200,
    "deals list response time < 800ms": (r) => r.timings.duration < 800,
    "deals list contains data": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && Array.isArray(body.data.deals);
      } catch {
        return false;
      }
    },
  });
}

function profileTest(data) {
  const token = data.authToken || authToken;

  if (!token) {
    console.log("No auth token available for profile test");
    return;
  }

  // Test profile endpoint
  const profileResponse = http.get(`${BASE_URL}/api/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` },
    tags: { name: "profile" },
  });

  check(profileResponse, {
    "profile status is 200": (r) => r.status === 200,
    "profile response time < 300ms": (r) => r.timings.duration < 300,
    "profile contains user data": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.user;
      } catch {
        return false;
      }
    },
  });
}

export function teardown(data) {
  console.log("Test completed. Check the summary for performance metrics.");
}
