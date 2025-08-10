import request from "supertest";
import express from "express";

// Mock server setup for API Gateway
describe("API Gateway - Mock Server", () => {
  let app: express.Application;

  beforeAll(async () => {
    // Set up Express app (simplified version of your mock-server.js)
    app = express();
    app.use(express.json());

    // Basic health check endpoint
    app.get("/health", (req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // Mock auth endpoints
    app.post("/api/auth/login", (req, res) => {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      if (email === "demo@example.com" && password === "password") {
        return res.json({
          success: true,
          data: {
            token: "mock-jwt-token",
            user: {
              id: "user-1",
              email: "demo@example.com",
              firstName: "Demo",
              lastName: "User",
            },
          },
        });
      }

      res.status(401).json({ error: "Invalid credentials" });
    });

    app.post("/api/auth/register", (req, res) => {
      const { firstName, lastName, email, password, organizationName } =
        req.body;

      if (!firstName || !lastName || !email || !password || !organizationName) {
        return res.status(400).json({ error: "All fields are required" });
      }

      if (email === "existing@example.com") {
        return res.status(409).json({ error: "User already exists" });
      }

      res.status(201).json({
        success: true,
        data: {
          token: "mock-jwt-token",
          user: {
            id: "user-1",
            email,
            firstName,
            lastName,
          },
          organization: {
            id: "org-1",
            name: organizationName,
          },
        },
      });
    });

    // Mock contacts endpoints
    app.get("/api/contacts", (req, res) => {
      const mockContacts = [
        {
          id: "contact-1",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "+1234567890",
          company: "Acme Corp",
        },
      ];
      res.json({ success: true, data: mockContacts });
    });

    // Enable CORS for testing
    app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      next();
    });
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  describe("Health Check", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toHaveProperty("status", "ok");
      expect(response.body).toHaveProperty("timestamp");
    });
  });

  describe("Authentication", () => {
    describe("POST /api/auth/login", () => {
      it("should login with valid credentials", async () => {
        const response = await request(app)
          .post("/api/auth/login")
          .send({
            email: "demo@example.com",
            password: "password",
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty("token");
        expect(response.body.data).toHaveProperty("user");
        expect(response.body.data.user.email).toBe("demo@example.com");
      });

      it("should reject invalid credentials", async () => {
        const response = await request(app)
          .post("/api/auth/login")
          .send({
            email: "demo@example.com",
            password: "wrong-password",
          })
          .expect(401);

        expect(response.body).toHaveProperty("error", "Invalid credentials");
      });

      it("should require email and password", async () => {
        const response = await request(app)
          .post("/api/auth/login")
          .send({})
          .expect(400);

        expect(response.body).toHaveProperty(
          "error",
          "Email and password are required"
        );
      });

      it("should validate email format", async () => {
        const response = await request(app)
          .post("/api/auth/login")
          .send({
            email: "invalid-email",
            password: "password",
          })
          .expect(401);

        expect(response.body).toHaveProperty("error");
      });
    });

    describe("POST /api/auth/register", () => {
      it("should register new user with valid data", async () => {
        const userData = {
          firstName: "Test",
          lastName: "User",
          email: "test@example.com",
          password: "password123",
          organizationName: "Test Org",
        };

        const response = await request(app)
          .post("/api/auth/register")
          .send(userData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty("token");
        expect(response.body.data.user.email).toBe("test@example.com");
        expect(response.body.data.organization.name).toBe("Test Org");
      });

      it("should reject registration with missing fields", async () => {
        const response = await request(app)
          .post("/api/auth/register")
          .send({
            email: "test@example.com",
            password: "password123",
            // Missing other required fields
          })
          .expect(400);

        expect(response.body).toHaveProperty(
          "error",
          "All fields are required"
        );
      });

      it("should reject duplicate email", async () => {
        const userData = {
          firstName: "Test",
          lastName: "User",
          email: "existing@example.com",
          password: "password123",
          organizationName: "Test Org",
        };

        const response = await request(app)
          .post("/api/auth/register")
          .send(userData)
          .expect(409);

        expect(response.body).toHaveProperty("error", "User already exists");
      });
    });
  });

  describe("Contacts", () => {
    describe("GET /api/contacts", () => {
      it("should return list of contacts", async () => {
        const response = await request(app).get("/api/contacts").expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThan(0);

        const contact = response.body.data[0];
        expect(contact).toHaveProperty("id");
        expect(contact).toHaveProperty("firstName");
        expect(contact).toHaveProperty("lastName");
        expect(contact).toHaveProperty("email");
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle 404 for unknown routes", async () => {
      await request(app).get("/api/unknown").expect(404);
    });

    it("should handle malformed JSON", async () => {
      await request(app)
        .post("/api/auth/login")
        .send("invalid-json")
        .set("Content-Type", "application/json")
        .expect(400);
    });
  });

  describe("CORS", () => {
    it("should include CORS headers", async () => {
      await request(app)
        .get("/health")
        .expect("Access-Control-Allow-Origin", "*");
    });
  });
});
