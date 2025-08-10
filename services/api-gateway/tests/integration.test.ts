import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";

describe("API Integration Tests", () => {
  let mongoServer: MongoMemoryServer;
  let mongoClient: MongoClient;
  let db: any;

  beforeAll(async () => {
    // Start in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to the database
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    db = mongoClient.db("test_crm");

    // Set environment variables
    process.env.DATABASE_URL = mongoUri;
    process.env.DATABASE_NAME = "test_crm";
    process.env.JWT_SECRET = "test-secret";
  });

  afterAll(async () => {
    // Cleanup
    if (mongoClient) {
      await mongoClient.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  describe("Authentication Endpoints", () => {
    it("POST /api/auth/register should create new user", async () => {
      // Import the server after setting environment variables
      const { app } = await import("../../services/api-gateway/mock-server");

      const userData = {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "password123",
        organizationName: "Test Organization",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();
    });

    it("POST /api/auth/login should authenticate user", async () => {
      const { app } = await import("../../services/api-gateway/mock-server");

      // First register a user
      await request(app).post("/api/auth/register").send({
        firstName: "Login",
        lastName: "Test",
        email: "login@example.com",
        password: "password123",
        organizationName: "Login Test Org",
      });

      // Then login
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "login@example.com",
          password: "password123",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe("login@example.com");
      expect(response.body.data.token).toBeDefined();
    });

    it("POST /api/auth/login should reject invalid credentials", async () => {
      const { app } = await import("../../services/api-gateway/mock-server");

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Invalid");
    });
  });

  describe("Contacts Endpoints", () => {
    let authToken: string;

    beforeAll(async () => {
      // Create and login user to get auth token
      const { app } = await import("../../services/api-gateway/mock-server");

      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send({
          firstName: "Contact",
          lastName: "Tester",
          email: "contact@example.com",
          password: "password123",
          organizationName: "Contact Test Org",
        });

      authToken = registerResponse.body.data.token;
    });

    it("GET /api/contacts should return contacts list", async () => {
      const { app } = await import("../../services/api-gateway/mock-server");

      const response = await request(app)
        .get("/api/contacts")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it("POST /api/contacts should create new contact", async () => {
      const { app } = await import("../../services/api-gateway/mock-server");

      const contactData = {
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "+1234567890",
        jobTitle: "Manager",
        status: "active",
      };

      const response = await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authToken}`)
        .send(contactData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(contactData.name);
      expect(response.body.data.email).toBe(contactData.email);
    });

    it("GET /api/contacts should support search", async () => {
      const { app } = await import("../../services/api-gateway/mock-server");

      // First create a contact
      await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Search Test",
          email: "search@example.com",
          status: "active",
        });

      // Then search for it
      const response = await request(app)
        .get("/api/contacts?search=Search")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(
        response.body.data.some((contact: any) =>
          contact.name.includes("Search")
        )
      ).toBe(true);
    });
  });

  describe("Companies Endpoints", () => {
    let authToken: string;

    beforeAll(async () => {
      const { app } = await import("../../services/api-gateway/mock-server");

      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send({
          firstName: "Company",
          lastName: "Tester",
          email: "company@example.com",
          password: "password123",
          organizationName: "Company Test Org",
        });

      authToken = registerResponse.body.data.token;
    });

    it("POST /api/companies should create new company", async () => {
      const { app } = await import("../../services/api-gateway/mock-server");

      const companyData = {
        name: "Test Company",
        website: "https://test.com",
        industry: "Technology",
        status: "active",
      };

      const response = await request(app)
        .post("/api/companies")
        .set("Authorization", `Bearer ${authToken}`)
        .send(companyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(companyData.name);
      expect(response.body.data.website).toBe(companyData.website);
    });

    it("GET /api/companies should return companies list", async () => {
      const { app } = await import("../../services/api-gateway/mock-server");

      const response = await request(app)
        .get("/api/companies")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("Deals Endpoints", () => {
    let authToken: string;

    beforeAll(async () => {
      const { app } = await import("../../services/api-gateway/mock-server");

      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send({
          firstName: "Deal",
          lastName: "Tester",
          email: "deal@example.com",
          password: "password123",
          organizationName: "Deal Test Org",
        });

      authToken = registerResponse.body.data.token;
    });

    it("POST /api/deals should create new deal", async () => {
      const { app } = await import("../../services/api-gateway/mock-server");

      const dealData = {
        name: "Test Deal",
        value: 50000,
        stage: "qualified",
        probability: 75,
        expectedCloseDate: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        company: "Test Company",
        contactName: "Test Contact",
      };

      const response = await request(app)
        .post("/api/deals")
        .set("Authorization", `Bearer ${authToken}`)
        .send(dealData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(dealData.name);
      expect(response.body.data.value).toBe(dealData.value);
    });

    it("GET /api/deals should return deals list", async () => {
      const { app } = await import("../../services/api-gateway/mock-server");

      const response = await request(app)
        .get("/api/deals")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("Security Features", () => {
    it("should enforce rate limiting", async () => {
      const { app } = await import("../../services/api-gateway/mock-server");

      // Make multiple rapid requests to trigger rate limiting
      const requests = Array(10)
        .fill(null)
        .map(() =>
          request(app).post("/api/auth/login").send({
            email: "test@example.com",
            password: "wrongpassword",
          })
        );

      const responses = await Promise.allSettled(requests);

      // Some requests should be rate limited (429)
      const rateLimitedResponses = responses.filter(
        (result) =>
          result.status === "fulfilled" && (result.value as any).status === 429
      );

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it("should validate input and prevent injection", async () => {
      const { app } = await import("../../services/api-gateway/mock-server");

      // Try to inject malicious script
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          firstName: '<script>alert("xss")</script>',
          lastName: "Test",
          email: "injection@example.com",
          password: "password123",
          organizationName: "Test Org",
        })
        .expect(201);

      // Should sanitize the input
      expect(response.body.data.user.firstName).not.toContain("<script>");
      expect(response.body.data.user.firstName).not.toContain("alert");
    });
  });
});
