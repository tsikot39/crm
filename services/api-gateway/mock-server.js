// Load environment variables first
require("dotenv").config({ path: "../../.env" });

// Enhanced server with MongoDB integration
const http = require("http");
const url = require("url");
const bcrypt = require("bcryptjs");
const { MongoClient, ObjectId } = require("mongodb");

const PORT = 3001;

// Input sanitization utilities
const sanitizeSearchQuery = (query) => {
  if (!query || typeof query !== "string") return "";

  // Remove dangerous patterns and escape regex special chars
  const sanitized = query
    .trim()
    .slice(0, 100) // Limit length
    .replace(/[<>'";&\\]/g, "") // Remove potentially dangerous characters
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Escape regex special characters

  return sanitized;
};

const sanitizeEmail = (email) => {
  if (!email || typeof email !== "string") return "";
  return email.toLowerCase().trim().slice(0, 254); // RFC 5321 limit
};

const sanitizeText = (input, maxLength = 255) => {
  if (!input || typeof input !== "string") return "";
  return input.trim().slice(0, maxLength).replace(/[<>]/g, ""); // Basic XSS prevention
};

const sanitizeNumber = (input, defaultValue = 0) => {
  const num = Number(input);
  return isNaN(num) ? defaultValue : Math.max(0, num);
};

// MongoDB configuration
const MONGODB_URI =
  "mongodb+srv://tsikot39:n4w5rb@cluster0.3f8yqnc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const DATABASE_NAME = "crm_saas_platform";

let db = null;

// In-memory password reset tokens (in production, use database)
const passwordResetTokens = new Map();

// Connect to MongoDB
async function connectToDatabase() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DATABASE_NAME);
    console.log("✅ Connected to MongoDB Atlas successfully");

    // Create indexes for better performance
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db
      .collection("organizations")
      .createIndex({ slug: 1 }, { unique: true });
    await db.collection("contacts").createIndex({ organizationId: 1 });
    await db.collection("contacts").createIndex({ email: 1 });

    return true;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    return false;
  }
}

// Seed sample contacts data with proper company relationships
async function seedContacts(organizationId) {
  try {
    const existingContacts = await db
      .collection("contacts")
      .countDocuments({ organizationId });

    if (existingContacts === 0) {
      console.log(
        "🌱 Seeding sample contacts data with company relationships..."
      );

      // First, get existing companies to link contacts to them
      const companies = await db
        .collection("companies")
        .find({ organizationId })
        .toArray();

      const sampleContacts = [
        {
          _id: new ObjectId(),
          organizationId,
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@acme.com",
          phone: "+1-555-0123",
          companyId:
            companies.find((c) => c.name === "Acme Corporation")?._id || null,
          jobTitle: "Sales Manager",
          status: "active",
          tags: ["lead", "enterprise"],
          lastContact: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          updatedAt: new Date(),
        },
        {
          _id: new ObjectId(),
          organizationId,
          firstName: "Jane",
          lastName: "Smith",
          email: "jane.smith@techstart.com",
          phone: "+1-555-0124",
          companyId:
            companies.find((c) => c.name === "TechStart Inc")?._id || null,
          jobTitle: "CTO",
          status: "active",
          tags: ["customer", "technical"],
          lastContact: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
          updatedAt: new Date(),
        },
        {
          _id: new ObjectId(),
          organizationId,
          firstName: "Michael",
          lastName: "Johnson",
          email: "michael.j@globalsolutions.com",
          phone: "+1-555-0125",
          companyId:
            companies.find((c) => c.name === "Global Solutions Ltd")?._id ||
            null,
          jobTitle: "Founder",
          status: "prospect",
          tags: ["startup", "hot-lead"],
          lastContact: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          updatedAt: new Date(),
        },
        {
          _id: new ObjectId(),
          organizationId,
          firstName: "Sarah",
          lastName: "Wilson",
          email: "sarah.wilson@enterprisesys.com",
          phone: "+1-555-0126",
          companyId:
            companies.find((c) => c.name === "Enterprise Systems")?._id || null,
          jobTitle: "VP of Sales",
          status: "active",
          tags: ["enterprise", "decision-maker"],
          lastContact: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
          updatedAt: new Date(),
        },
        {
          _id: new ObjectId(),
          organizationId,
          firstName: "David",
          lastName: "Brown",
          email: "david.brown@innovativedesigns.co",
          phone: "+1-555-0127",
          companyId:
            companies.find((c) => c.name === "Innovative Designs")?._id || null,
          jobTitle: "Principal Designer",
          status: "inactive",
          tags: ["creative", "referral"],
          lastContact: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
          updatedAt: new Date(),
        },
        {
          _id: new ObjectId(),
          organizationId,
          firstName: "Emily",
          lastName: "Davis",
          email: "emily.freelancer@gmail.com",
          phone: "+1-555-0128",
          companyId: null, // Independent freelancer - no company
          jobTitle: "Freelance Consultant",
          status: "prospect",
          tags: ["freelancer", "individual"],
          lastContact: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
          updatedAt: new Date(),
        },
      ];

      await db.collection("contacts").insertMany(sampleContacts);
      console.log(
        `✅ Seeded ${sampleContacts.length} sample contacts for organization ${organizationId}`
      );
    }
  } catch (error) {
    console.error("Error seeding contacts:", error);
  }
}

// Seed sample companies data
async function seedCompanies(organizationId) {
  try {
    const existingCompanies = await db
      .collection("companies")
      .countDocuments({ organizationId });

    if (existingCompanies === 0) {
      console.log("🌱 Seeding sample companies data...");

      const sampleCompanies = [
        {
          _id: new ObjectId(),
          organizationId,
          name: "Acme Corporation",
          website: "https://acmecorp.com",
          industry: "Technology",
          size: "large",
          revenue: 0, // Real CRM starts with $0, revenue comes from closed deals
          location: "San Francisco, CA",
          primaryContact: "John Doe",
          contactCount: 12,
          dealCount: 3,
          lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0], // 1 day ago
          status: "active",
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          updatedAt: new Date(),
        },
        {
          _id: new ObjectId(),
          organizationId,
          name: "TechStart Inc",
          website: "https://techstart.io",
          industry: "Software",
          size: "startup",
          revenue: 0, // Real CRM starts with $0, revenue comes from closed deals
          location: "Austin, TX",
          primaryContact: "Sarah Wilson",
          contactCount: 5,
          dealCount: 2,
          lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0], // 3 days ago
          status: "prospect",
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
          updatedAt: new Date(),
        },
        {
          _id: new ObjectId(),
          organizationId,
          name: "Global Solutions Ltd",
          website: "https://globalsolutions.com",
          industry: "Consulting",
          size: "medium",
          revenue: 0, // Real CRM starts with $0, revenue comes from closed deals
          location: "New York, NY",
          primaryContact: "Michael Johnson",
          contactCount: 8,
          dealCount: 1,
          lastActivity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0], // 7 days ago
          status: "active",
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
          updatedAt: new Date(),
        },
        {
          _id: new ObjectId(),
          organizationId,
          name: "Innovative Designs",
          website: "https://innovativedesigns.co",
          industry: "Design",
          size: "small",
          revenue: 0, // Real CRM starts with $0, revenue comes from closed deals
          location: "Los Angeles, CA",
          primaryContact: "Emily Davis",
          contactCount: 4,
          dealCount: 0,
          lastActivity: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0], // 14 days ago
          status: "prospect",
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
          updatedAt: new Date(),
        },
        {
          _id: new ObjectId(),
          organizationId,
          name: "Enterprise Systems",
          website: "https://enterprisesys.com",
          industry: "Enterprise Software",
          size: "enterprise",
          revenue: 0, // Real CRM starts with $0, revenue comes from closed deals
          location: "Seattle, WA",
          primaryContact: "David Brown",
          contactCount: 20,
          dealCount: 5,
          lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0], // 2 days ago
          status: "active",
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
          updatedAt: new Date(),
        },
      ];

      await db.collection("companies").insertMany(sampleCompanies);
      console.log(
        `✅ Seeded ${sampleCompanies.length} sample companies for organization ${organizationId}`
      );
    }
  } catch (error) {
    console.error("Error seeding companies:", error);
  }
}

// Seed sample deals data
async function seedDeals(organizationId) {
  try {
    const existingDeals = await db
      .collection("deals")
      .countDocuments({ organizationId });

    if (existingDeals === 0) {
      console.log("🌱 Seeding sample deals data...");

      // Get existing companies to link deals to them
      const companies = await db
        .collection("companies")
        .find({ organizationId })
        .toArray();

      const contacts = await db
        .collection("contacts")
        .find({ organizationId })
        .toArray();

      const sampleDeals = [
        {
          _id: new ObjectId(),
          organizationId,
          title: "Enterprise Package",
          company:
            companies.find((c) => c.name === "Acme Corporation")?.name ||
            "Acme Corporation",
          contactName:
            contacts.find((c) => c.firstName === "John" && c.lastName === "Doe")
              ?.firstName +
              " " +
              contacts.find(
                (c) => c.firstName === "John" && c.lastName === "Doe"
              )?.lastName || "John Doe",
          value: 45000,
          probability: 90,
          stage: "negotiation",
          expectedCloseDate: "2025-08-15",
          lastActivity: "2025-08-05",
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          updatedAt: new Date(),
        },
        {
          _id: new ObjectId(),
          organizationId,
          title: "Growth Plan Implementation",
          company:
            companies.find((c) => c.name === "TechStart Inc")?.name ||
            "TechStart Inc",
          contactName:
            contacts.find(
              (c) => c.firstName === "Jane" && c.lastName === "Smith"
            )?.firstName +
              " " +
              contacts.find(
                (c) => c.firstName === "Jane" && c.lastName === "Smith"
              )?.lastName || "Jane Smith",
          value: 28500,
          probability: 75,
          stage: "proposal",
          expectedCloseDate: "2025-08-20",
          lastActivity: "2025-08-04",
          createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
          updatedAt: new Date(),
        },
        {
          _id: new ObjectId(),
          organizationId,
          title: "Premium License Renewal",
          company:
            companies.find((c) => c.name === "Global Solutions Ltd")?.name ||
            "Global Solutions Ltd",
          contactName:
            contacts.find(
              (c) => c.firstName === "Michael" && c.lastName === "Johnson"
            )?.firstName +
              " " +
              contacts.find(
                (c) => c.firstName === "Michael" && c.lastName === "Johnson"
              )?.lastName || "Michael Johnson",
          value: 67200,
          probability: 60,
          stage: "qualified",
          expectedCloseDate: "2025-08-25",
          lastActivity: "2025-08-03",
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
          updatedAt: new Date(),
        },
        {
          _id: new ObjectId(),
          organizationId,
          title: "Startup Package",
          company:
            companies.find((c) => c.name === "InnovateTech Solutions")?.name ||
            "InnovateTech Solutions",
          contactName:
            contacts.find(
              (c) => c.firstName === "Sarah" && c.lastName === "Wilson"
            )?.firstName +
              " " +
              contacts.find(
                (c) => c.firstName === "Sarah" && c.lastName === "Wilson"
              )?.lastName || "Sarah Wilson",
          value: 15000,
          probability: 85,
          stage: "negotiation",
          expectedCloseDate: "2025-08-12",
          lastActivity: "2025-08-06",
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
          updatedAt: new Date(),
        },
        {
          _id: new ObjectId(),
          organizationId,
          title: "Consulting Services",
          company: "Independent Contractor",
          contactName:
            contacts.find(
              (c) => c.firstName === "Emily" && c.lastName === "Davis"
            )?.firstName +
              " " +
              contacts.find(
                (c) => c.firstName === "Emily" && c.lastName === "Davis"
              )?.lastName || "Emily Davis",
          value: 12500,
          probability: 40,
          stage: "lead",
          expectedCloseDate: "2025-09-01",
          lastActivity: "2025-08-01",
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          updatedAt: new Date(),
        },
        {
          _id: new ObjectId(),
          organizationId,
          title: "Enterprise Integration",
          company: companies[0]?.name || "Demo Company",
          contactName:
            contacts[0]?.firstName + " " + contacts[0]?.lastName ||
            "Demo Contact",
          value: 125000,
          probability: 95,
          stage: "closed-won",
          expectedCloseDate: "2025-07-30",
          lastActivity: "2025-07-30",
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
          updatedAt: new Date(),
        },
        {
          _id: new ObjectId(),
          organizationId,
          title: "Basic Plan",
          company: "Small Business Corp",
          contactName: "John Smith",
          value: 5000,
          probability: 0,
          stage: "closed-lost",
          expectedCloseDate: "2025-07-15",
          lastActivity: "2025-07-15",
          createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000), // 50 days ago
          updatedAt: new Date(),
        },
      ];

      await db.collection("deals").insertMany(sampleDeals);
      console.log(
        `✅ Seeded ${sampleDeals.length} sample deals for organization ${organizationId}`
      );
    }
  } catch (error) {
    console.error("Error seeding deals:", error);
  }
}

// Mock JWT token generation
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    organizationId: user.organizationId,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  };

  // Simple base64 encoding (not secure, just for testing)
  return Buffer.from(JSON.stringify(payload)).toString("base64");
};

// Mock JWT token verification
const verifyToken = (token) => {
  try {
    const payload = JSON.parse(Buffer.from(token, "base64").toString());

    // Check if token is expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      id: payload.userId,
      email: payload.email,
      organizationId: payload.organizationId,
      role: payload.role,
    };
  } catch (error) {
    return null;
  }
};

// Professional email template for password reset (Resend-optimized)
const createPasswordResetEmailTemplate = (userName, resetUrl, resetToken) => {
  const baseStyle = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; background: #f9fafb; }
    .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 48px 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 32px; font-weight: 700; margin: 0; }
    .content { padding: 48px 32px; }
    .content h2 { color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 24px 0; }
    .content p { color: #6b7280; margin: 0 0 24px 0; font-size: 16px; line-height: 1.5; }
    .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); 
              color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; 
              text-align: center; margin: 24px 0; transition: all 0.2s ease; }
    .button:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4); }
    .security-box { background: #f3f4f6; border-left: 4px solid #6366f1; padding: 24px; margin: 32px 0; border-radius: 0 8px 8px 0; }
    .security-box h3 { color: #111827; font-size: 16px; font-weight: 600; margin: 0 0 16px 0; }
    .security-box ul { color: #6b7280; margin: 0; padding-left: 20px; }
    .security-box li { margin: 8px 0; }
    .token-box { background: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0; }
    .token { font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 14px; font-weight: 600; color: #374151; letter-spacing: 1px; }
    .footer { background: #f9fafb; padding: 32px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { color: #9ca3af; font-size: 14px; margin: 4px 0; }
    .link { color: #6366f1; word-break: break-all; }
    @media (max-width: 600px) { 
      .header, .content, .footer { padding: 32px 24px; } 
      .button { width: 100%; }
    }
  `;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>${baseStyle}</style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>🔐 Password Reset</h1>
        </div>
        
        <div class="content">
          <h2>Hi ${userName},</h2>
          
          <p>We received a request to reset your password for your CRM account. If you made this request, click the button below to create a new password:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset My Password</a>
          </div>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p><span class="link">${resetUrl}</span></p>
          
          <div class="security-box">
            <h3>🛡️ Security Information</h3>
            <ul>
              <li>This link expires in <strong>1 hour</strong> for your security</li>
              <li>You can only use this link <strong>once</strong></li>
              <li>If you didn't request this reset, you can safely ignore this email</li>
              <li>Your current password will remain unchanged until you create a new one</li>
            </ul>
          </div>
          
          <p>Alternatively, you can enter this reset token manually on our password reset page:</p>
          <div class="token-box">
            <div class="token">${resetToken}</div>
          </div>
          
          <p style="color: #9ca3af; font-size: 14px;">If you're having trouble, please contact our support team. We're here to help!</p>
        </div>
        
        <div class="footer">
          <p><strong>${
            process.env.EMAIL_FROM_NAME || "CRM Platform"
          }</strong></p>
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} ${
    process.env.EMAIL_FROM_NAME || "CRM Platform"
  }. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Password Reset Request

Hi ${userName},

We received a request to reset your password for your CRM account.

Reset your password by clicking this link: ${resetUrl}

Or use this reset token: ${resetToken}

SECURITY INFORMATION:
• This link expires in 1 hour
• You can only use this link once
• If you didn't request this, ignore this email
• Your current password remains unchanged until you create a new one

Need help? Contact our support team.

Best regards,
${process.env.EMAIL_FROM_NAME || "CRM Platform"} Team

This is an automated message. Please do not reply.
  `.trim();

  return {
    subject: "🔐 Reset Your CRM Password",
    html,
    text,
  };
};

// Mock database
const users = [];
const organizations = [];

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Log all incoming requests
  console.log(
    `📥 ${new Date().toISOString()} - ${req.method} ${req.url} from ${
      req.headers.host
    }`
  );

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Helper function to send JSON response
  const sendJSON = (data, statusCode = 200) => {
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  };

  // Helper function to get request body
  const getRequestBody = () => {
    return new Promise((resolve) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({});
        }
      });
    });
  };

  // Register endpoint
  if (pathname === "/api/auth/register" && req.method === "POST") {
    if (!db) {
      return sendJSON(
        {
          success: false,
          message: "Database connection not available",
        },
        500
      );
    }

    getRequestBody().then(async (data) => {
      try {
        const { firstName, lastName, email, password, organizationName } = data;

        // Basic validation
        if (
          !firstName ||
          !lastName ||
          !email ||
          !password ||
          !organizationName
        ) {
          return sendJSON(
            {
              success: false,
              message: "All fields are required",
            },
            400
          );
        }

        // Check if user already exists
        const existingUser = await db.collection("users").findOne({
          email: email.toLowerCase(),
        });

        if (existingUser) {
          return sendJSON(
            {
              success: false,
              message: "User with this email already exists",
            },
            409
          );
        }

        // Check if organization slug already exists
        const existingOrg = await db.collection("organizations").findOne({
          slug: organizationSlug,
        });

        if (existingOrg) {
          return sendJSON(
            {
              success: false,
              message: "Organization with this name already exists",
            },
            409
          );
        }

        // Sanitize inputs
        const sanitizedFirstName = sanitizeText(firstName, 50);
        const sanitizedLastName = sanitizeText(lastName, 50);
        const sanitizedEmail = sanitizeEmail(email);
        const sanitizedOrgName = sanitizeText(organizationName, 100);

        // Hash password with bcrypt
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create organization slug
        const organizationSlug = sanitizedOrgName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

        // Create organization document
        const organizationDoc = {
          _id: new ObjectId(),
          name: sanitizedOrgName,
          slug: organizationSlug,
          plan: "starter",
          status: "active",
          settings: {
            currency: "USD",
            timezone: "UTC",
            dateFormat: "MM/DD/YYYY",
            features: ["contacts", "deals", "activities"],
          },
          billing: {
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Insert organization
        await db.collection("organizations").insertOne(organizationDoc);

        // Create user document
        const userDoc = {
          _id: new ObjectId(),
          firstName: sanitizedFirstName,
          lastName: sanitizedLastName,
          email: sanitizedEmail,
          password: hashedPassword,
          organizationId: organizationDoc._id.toString(),
          role: "admin",
          isActive: true,
          preferences: {
            theme: "light",
            notifications: true,
            timezone: "UTC",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Insert user
        await db.collection("users").insertOne(userDoc);

        // Generate token
        const token = generateToken({
          id: userDoc._id.toString(),
          email: userDoc.email,
          organizationId: userDoc.organizationId,
          role: userDoc.role,
        });

        console.log(`✅ User registered in MongoDB: ${email}`);

        sendJSON(
          {
            success: true,
            message: "Registration successful",
            data: {
              token,
              user: {
                id: userDoc._id.toString(),
                firstName: userDoc.firstName,
                lastName: userDoc.lastName,
                email: userDoc.email,
                role: userDoc.role,
                organizationId: userDoc.organizationId,
                preferences: userDoc.preferences,
              },
              organization: {
                id: organizationDoc._id.toString(),
                name: organizationDoc.name,
                slug: organizationDoc.slug,
                plan: organizationDoc.plan,
                settings: organizationDoc.settings,
              },
            },
          },
          201
        );
      } catch (error) {
        console.error("Registration error:", error);
        sendJSON(
          {
            success: false,
            message: "Registration failed",
          },
          500
        );
      }
    });
    return;
  }

  // Login endpoint
  if (pathname === "/api/auth/login" && req.method === "POST") {
    if (!db) {
      return sendJSON(
        {
          success: false,
          message: "Database connection not available",
        },
        500
      );
    }

    getRequestBody().then(async (data) => {
      try {
        const { email, password } = data;
        console.log("🔐 Login attempt for:", email);

        // Basic validation
        if (!email || !password) {
          console.log("❌ Missing email or password");
          return sendJSON(
            {
              success: false,
              message: "Email and password are required",
            },
            400
          );
        }

        // Find user in database
        const user = await db.collection("users").findOne({
          email: email.toLowerCase(),
        });

        if (!user) {
          console.log("❌ User not found:", email);
          return sendJSON(
            {
              success: false,
              message: "Invalid credentials",
            },
            401
          );
        }

        // Check if user is active
        if (!user.isActive) {
          console.log("❌ User account deactivated:", email);
          return sendJSON(
            {
              success: false,
              message: "Account is deactivated",
            },
            401
          );
        }

        // Check password with bcrypt
        console.log("🔑 Checking password for user:", email);
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          console.log("❌ Invalid password for user:", email);
          return sendJSON(
            {
              success: false,
              message: "Invalid credentials",
            },
            401
          );
        }

        // Update last login
        await db.collection("users").updateOne(
          { _id: user._id },
          {
            $set: {
              lastLoginAt: new Date(),
              updatedAt: new Date(),
            },
          }
        );

        // Find organization
        const organization = await db.collection("organizations").findOne({
          _id: new ObjectId(user.organizationId),
        });

        // Seed sample contacts if none exist for this organization
        await seedContacts(user.organizationId);
        await seedCompanies(user.organizationId);
        await seedDeals(user.organizationId);

        // Generate token
        const token = generateToken({
          id: user._id.toString(),
          email: user.email,
          organizationId: user.organizationId,
          role: user.role,
        });

        console.log(`✅ User logged in from MongoDB: ${email}`);

        sendJSON({
          success: true,
          message: "Login successful",
          data: {
            token,
            user: {
              id: user._id.toString(),
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              role: user.role,
              organizationId: user.organizationId,
              preferences: user.preferences,
              lastLoginAt: new Date(),
              createdAt: user.createdAt,
            },
            organization: organization
              ? {
                  id: organization._id.toString(),
                  name: organization.name,
                  slug: organization.slug,
                  plan: organization.plan,
                  settings: organization.settings,
                }
              : null,
          },
        });
      } catch (error) {
        console.error("Login error:", error);
        sendJSON(
          {
            success: false,
            message: "Login failed",
          },
          500
        );
      }
    });
    return;
  }

  // Health check
  if (pathname === "/api/health" && req.method === "GET") {
    (async () => {
      if (db) {
        try {
          const userCount = await db.collection("users").countDocuments();
          const orgCount = await db
            .collection("organizations")
            .countDocuments();

          sendJSON({
            status: "healthy",
            message: "API Gateway is running with MongoDB",
            timestamp: new Date().toISOString(),
            database: "connected",
            users: userCount,
            organizations: orgCount,
          });
        } catch (error) {
          console.error("Health check database error:", error);
          sendJSON({
            status: "healthy",
            message: "API Gateway is running with MongoDB connection issue",
            timestamp: new Date().toISOString(),
            database: "error",
            users: 0,
            organizations: 0,
          });
        }
      } else {
        sendJSON({
          status: "healthy",
          message: "API Gateway is running without database",
          timestamp: new Date().toISOString(),
          database: "disconnected",
          users: 0,
          organizations: 0,
        });
      }
    })();
    return;
  }

  // Contact Sales endpoint
  if (pathname === "/api/contact-sales" && req.method === "POST") {
    getRequestBody().then(async (data) => {
      try {
        const { fullName, email, companyName, companySize, phone, message } = data;
        
        // Basic validation
        if (!fullName || !email || !companyName || !companySize) {
          return sendJSON({
            success: false,
            message: "Missing required fields"
          }, 400);
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return sendJSON({
            success: false,
            message: "Invalid email address"
          }, 400);
        }

        // Use nodemailer with Resend SMTP
        const nodemailer = require("nodemailer");

        // Resend SMTP configuration (much better than Gmail for transactional emails)
        const transporterConfig = {
          host: process.env.SMTP_HOST || 'smtp.resend.com',
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true' || false,
          auth: {
            user: process.env.SMTP_USER || 'resend',
            pass: process.env.SMTP_PASS || 're_ctqT9sYN_GEXRr75BZY9qoKwdmtA5M7Hg'
          }
        };

        const transporter = nodemailer.createTransporter(transporterConfig);

        // Email content
        const mailOptions = {
          from: `${process.env.EMAIL_FROM_NAME || 'CRM Platform'} <${process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev'}>`,
          to: process.env.SALES_EMAIL || 'corpusjohnbenedict@gmail.com',
          subject: `New Enterprise Sales Inquiry from ${companyName}`,
          html: `
            <h2>New Enterprise Sales Lead</h2>
            <p><strong>Contact Information:</strong></p>
            <ul>
              <li><strong>Name:</strong> ${fullName}</li>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Company:</strong> ${companyName}</li>
              <li><strong>Company Size:</strong> ${companySize}</li>
              ${phone ? `<li><strong>Phone:</strong> ${phone}</li>` : ''}
            </ul>
            
            ${message ? `
              <p><strong>Requirements/Message:</strong></p>
              <p>${message.replace(/\n/g, '<br>')}</p>
            ` : ''}
            
            <hr>
            <p><small>This inquiry was submitted through your CRM SaaS pricing page on ${new Date().toLocaleString()}.</small></p>
          `,
        };

        // Send email
        await transporter.sendMail(mailOptions);
        
        console.log(`📧 Contact sales email sent for ${companyName} (${email})`);

        // Optionally store in database
        if (db) {
          await db.collection("sales_inquiries").insertOne({
            fullName,
            email,
            companyName,
            companySize,
            phone: phone || null,
            message: message || null,
            createdAt: new Date(),
            status: "new"
          });
          console.log(`💾 Sales inquiry stored in database`);
        }

        sendJSON({
          success: true,
          message: "Your inquiry has been submitted successfully. Our sales team will contact you within 24 hours."
        });

      } catch (error) {
        console.error("❌ Contact sales error:", error);
        sendJSON({
          success: false,
          message: "Failed to submit your inquiry. Please try again later."
        }, 500);
      }
    });
    return;
  }

  // Verify token endpoint
  if (pathname === "/api/auth/verify" && req.method === "GET") {
    const authToken = req.headers.authorization?.replace("Bearer ", "");

    if (!authToken) {
      sendJSON(
        {
          success: false,
          message: "Authentication required",
        },
        401
      );
      return;
    }

    try {
      // Decode token
      const payload = JSON.parse(Buffer.from(authToken, "base64").toString());

      if (!payload.userId || !payload.organizationId) {
        sendJSON(
          {
            success: false,
            message: "Invalid token",
          },
          401
        );
        return;
      }

      // Check if token is expired (basic check)
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        sendJSON(
          {
            success: false,
            message: "Token expired",
          },
          401
        );
        return;
      }

      // In a real implementation, you would verify the token signature
      // and check if the user still exists and is active in the database

      console.log(`✅ Token verified for user ${payload.userId}`);

      sendJSON({
        success: true,
        message: "Token is valid",
        data: {
          userId: payload.userId,
          email: payload.email,
          organizationId: payload.organizationId,
          role: payload.role,
        },
      });
    } catch (error) {
      console.error("Token verification error:", error);
      sendJSON(
        {
          success: false,
          message: "Invalid token",
        },
        401
      );
    }
    return;
  }

  // Get user profile endpoint
  if (pathname === "/api/auth/profile" && req.method === "GET") {
    if (!db) {
      return sendJSON(
        {
          success: false,
          message: "Database connection not available",
        },
        500
      );
    }

    (async () => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return sendJSON(
            {
              success: false,
              message: "Authorization header required",
            },
            401
          );
        }

        const token = authHeader.replace("Bearer ", "");
        const decoded = verifyToken(token);

        if (!decoded) {
          return sendJSON(
            {
              success: false,
              message: "Invalid token",
            },
            401
          );
        }

        // Fetch user from database
        const user = await db.collection("users").findOne({
          _id: new ObjectId(decoded.id),
        });

        if (!user) {
          return sendJSON(
            {
              success: false,
              message: "User not found",
            },
            404
          );
        }

        // Fetch organization
        const organization = await db.collection("organizations").findOne({
          _id: new ObjectId(user.organizationId),
        });

        console.log(`✅ Profile fetched from MongoDB for user: ${user.email}`);

        sendJSON({
          success: true,
          data: {
            user: {
              id: user._id.toString(),
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              role: user.role,
              organizationId: user.organizationId,
              preferences: user.preferences,
              lastLoginAt: user.lastLoginAt,
              createdAt: user.createdAt,
            },
            organization: organization
              ? {
                  id: organization._id.toString(),
                  name: organization.name,
                  slug: organization.slug,
                  plan: organization.plan,
                  settings: organization.settings,
                }
              : null,
          },
        });
      } catch (error) {
        console.error("Profile fetch error:", error);
        sendJSON(
          {
            success: false,
            message: "Failed to fetch profile",
          },
          500
        );
      }
    })();
    return;
  }

  // PUT /api/auth/profile - Update user profile
  if (pathname === "/api/auth/profile" && req.method === "PUT") {
    if (!db) {
      return sendJSON(
        {
          success: false,
          message: "Database connection not available",
        },
        500
      );
    }

    getRequestBody().then(async (data) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return sendJSON(
            {
              success: false,
              message: "Authorization header required",
            },
            401
          );
        }

        const token = authHeader.replace("Bearer ", "");
        const decoded = verifyToken(token);

        if (!decoded) {
          return sendJSON(
            {
              success: false,
              message: "Invalid token",
            },
            401
          );
        }

        const { firstName, lastName, email } = data;

        // Basic validation
        if (!firstName || !lastName || !email) {
          return sendJSON(
            {
              success: false,
              message: "First name, last name, and email are required",
            },
            400
          );
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return sendJSON(
            {
              success: false,
              message: "Please enter a valid email address",
            },
            400
          );
        }

        // Check if email is already taken by another user
        const existingUser = await db.collection("users").findOne({
          email: email.toLowerCase(),
          _id: { $ne: new ObjectId(decoded.id) },
        });

        if (existingUser) {
          return sendJSON(
            {
              success: false,
              message: "Email is already taken by another user",
            },
            409
          );
        }

        // Update user in database
        const result = await db.collection("users").updateOne(
          { _id: new ObjectId(decoded.id) },
          {
            $set: {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              email: email.toLowerCase(),
              updatedAt: new Date(),
            },
          }
        );

        if (result.matchedCount === 0) {
          return sendJSON(
            {
              success: false,
              message: "User not found",
            },
            404
          );
        }

        // Fetch updated user data
        const updatedUser = await db.collection("users").findOne({
          _id: new ObjectId(decoded.id),
        });

        console.log(`✅ Profile updated for user: ${email}`);

        sendJSON({
          success: true,
          message: "Profile updated successfully",
          data: {
            user: {
              id: updatedUser._id.toString(),
              firstName: updatedUser.firstName,
              lastName: updatedUser.lastName,
              email: updatedUser.email,
              role: updatedUser.role,
              organizationId: updatedUser.organizationId,
              preferences: updatedUser.preferences,
              lastLoginAt: updatedUser.lastLoginAt,
              createdAt: updatedUser.createdAt,
            },
          },
        });
      } catch (error) {
        console.error("Profile update error:", error);
        sendJSON(
          {
            success: false,
            message: "Failed to update profile",
          },
          500
        );
      }
    });
    return;
  }

  // Dashboard data endpoint
  if (pathname === "/api/dashboard" && req.method === "GET") {
    const authToken = req.headers.authorization?.replace("Bearer ", "");

    if (!authToken) {
      sendJSON(
        {
          success: false,
          message: "Authentication required",
        },
        401
      );
      return;
    }

    (async () => {
      try {
        // Decode token
        const payload = JSON.parse(Buffer.from(authToken, "base64").toString());

        if (!payload.userId || !payload.organizationId) {
          sendJSON(
            {
              success: false,
              message: "Invalid token",
            },
            401
          );
          return;
        }

        // Fetch real data from database
        const contactsCount = await db.collection("contacts").countDocuments({
          organizationId: payload.organizationId,
        });

        // Fetch companies count
        const companiesCount = await db.collection("companies").countDocuments({
          organizationId: payload.organizationId,
        });

        // Fetch active deals (not closed-won or closed-lost)
        const activeDealsCount = await db.collection("deals").countDocuments({
          organizationId: payload.organizationId,
          stage: { $nin: ["closed-won", "closed-lost"] },
        });

        // Calculate monthly revenue from closed-won deals
        const currentMonth = new Date();
        const startOfMonth = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth(),
          1
        );
        const endOfMonth = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + 1,
          0,
          23,
          59,
          59
        );

        const monthlyDeals = await db
          .collection("deals")
          .find({
            organizationId: payload.organizationId,
            stage: "closed-won",
            createdAt: {
              $gte: startOfMonth,
              $lte: endOfMonth,
            },
          })
          .toArray();

        const monthlyRevenue = monthlyDeals.reduce(
          (sum, deal) => sum + (deal.value || 0),
          0
        );

        // Get top 5 deals by value (excluding closed deals)
        const topDeals = await db
          .collection("deals")
          .find({
            organizationId: payload.organizationId,
            stage: { $nin: ["closed-won", "closed-lost"] },
          })
          .sort({ value: -1 })
          .limit(5)
          .toArray();

        const formattedTopDeals = topDeals.map((deal) => ({
          id: deal._id.toString(),
          name: deal.title,
          value: deal.value,
          probability: deal.probability,
          expectedCloseDate: deal.expectedCloseDate,
        }));

        // Get recent activities from the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Fetch recent contacts, deals, and companies to generate activities
        const [recentContacts, recentDeals, recentCompanies] =
          await Promise.all([
            db
              .collection("contacts")
              .find({
                organizationId: payload.organizationId,
                createdAt: { $gte: sevenDaysAgo },
              })
              .sort({ createdAt: -1 })
              .limit(10)
              .toArray(),

            db
              .collection("deals")
              .find({
                organizationId: payload.organizationId,
                $or: [
                  { createdAt: { $gte: sevenDaysAgo } },
                  { updatedAt: { $gte: sevenDaysAgo } },
                ],
              })
              .sort({ updatedAt: -1 })
              .limit(10)
              .toArray(),

            db
              .collection("companies")
              .find({
                organizationId: payload.organizationId,
                createdAt: { $gte: sevenDaysAgo },
              })
              .sort({ createdAt: -1 })
              .limit(10)
              .toArray(),
          ]);

        // Generate activities from recent data
        const activities = [];

        // Add contact activities
        recentContacts.forEach((contact) => {
          activities.push({
            id: `contact_${contact._id}`,
            type: "contact_added",
            description: `New contact added: ${contact.firstName} ${contact.lastName}`,
            timestamp: contact.createdAt,
          });
        });

        // Add deal activities
        recentDeals.forEach((deal) => {
          const isNewDeal = deal.createdAt >= sevenDaysAgo;
          const isUpdated =
            deal.updatedAt > deal.createdAt && deal.updatedAt >= sevenDaysAgo;

          if (isNewDeal) {
            activities.push({
              id: `deal_created_${deal._id}`,
              type: "deal_created",
              description: `New deal created: ${deal.title} (${deal.company})`,
              timestamp: deal.createdAt,
            });
          }

          if (isUpdated && deal.stage === "closed-won") {
            activities.push({
              id: `deal_won_${deal._id}`,
              type: "deal_closed",
              description: `Deal closed won: ${deal.title} - $${
                deal.value?.toLocaleString() || 0
              }`,
              timestamp: deal.updatedAt,
            });
          } else if (isUpdated && !isNewDeal) {
            activities.push({
              id: `deal_updated_${deal._id}`,
              type: "deal_updated",
              description: `Deal updated: ${deal.title} moved to ${deal.stage}`,
              timestamp: deal.updatedAt,
            });
          }
        });

        // Add company activities
        recentCompanies.forEach((company) => {
          activities.push({
            id: `company_${company._id}`,
            type: "company_added",
            description: `New company added: ${company.name}`,
            timestamp: company.createdAt,
          });
        });

        // Sort activities by timestamp (most recent first) and limit to 10
        const sortedActivities = activities
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 10);

        // Calculate monthly revenue for the last 6 months
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const currentDate = new Date();
        const monthlyRevenueData = [];

        for (let i = 5; i >= 0; i--) {
          const targetDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() - i,
            1
          );
          const startOfMonth = new Date(
            targetDate.getFullYear(),
            targetDate.getMonth(),
            1
          );
          const endOfMonth = new Date(
            targetDate.getFullYear(),
            targetDate.getMonth() + 1,
            0,
            23,
            59,
            59
          );

          const monthDeals = await db
            .collection("deals")
            .find({
              organizationId: payload.organizationId,
              stage: "closed-won",
              createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            })
            .toArray();

          const revenue = monthDeals.reduce(
            (sum, deal) => sum + (deal.value || 0),
            0
          );

          monthlyRevenueData.push({
            month: monthNames[targetDate.getMonth()],
            revenue: revenue,
          });
        }

        // Get deals by stage distribution
        const allDeals = await db
          .collection("deals")
          .find({ organizationId: payload.organizationId })
          .toArray();

        const dealsByStage = allDeals.reduce((acc, deal) => {
          acc[deal.stage] = (acc[deal.stage] || 0) + 1;
          return acc;
        }, {});

        // Calculate growth percentages (month-over-month)
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const startOfLastMonth = new Date(
          lastMonth.getFullYear(),
          lastMonth.getMonth(),
          1
        );
        const endOfLastMonth = new Date(
          lastMonth.getFullYear(),
          lastMonth.getMonth() + 1,
          0,
          23,
          59,
          59
        );

        // Last month's counts for growth calculation
        const [
          lastMonthContacts,
          lastMonthCompanies,
          lastMonthActiveDeals,
          lastMonthRevenue,
        ] = await Promise.all([
          // Contacts created before this month
          db.collection("contacts").countDocuments({
            organizationId: payload.organizationId,
            createdAt: { $lte: endOfLastMonth },
          }),

          // Companies created before this month
          db.collection("companies").countDocuments({
            organizationId: payload.organizationId,
            createdAt: { $lte: endOfLastMonth },
          }),

          // Active deals from last month
          db.collection("deals").countDocuments({
            organizationId: payload.organizationId,
            stage: { $nin: ["closed-won", "closed-lost"] },
            createdAt: { $lte: endOfLastMonth },
          }),

          // Revenue from last month
          db
            .collection("deals")
            .find({
              organizationId: payload.organizationId,
              stage: "closed-won",
              createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
            })
            .toArray()
            .then((deals) =>
              deals.reduce((sum, deal) => sum + (deal.value || 0), 0)
            ),
        ]);

        // Calculate percentage growth
        const calculateGrowth = (current, previous) => {
          if (previous === 0) return current > 0 ? 100 : 0;
          return Math.round(((current - previous) / previous) * 100);
        };

        const contactsGrowth = calculateGrowth(
          contactsCount,
          lastMonthContacts
        );
        const companiesGrowth = calculateGrowth(
          companiesCount,
          lastMonthCompanies
        );
        const dealsGrowth = calculateGrowth(
          activeDealsCount,
          lastMonthActiveDeals
        );
        const revenueGrowth = calculateGrowth(monthlyRevenue, lastMonthRevenue);

        const dashboardData = {
          stats: {
            totalContacts: contactsCount,
            totalCompanies: companiesCount,
            activeDeals: activeDealsCount,
            monthlyRevenue: monthlyRevenue,
            contactsGrowth: contactsGrowth,
            companiesGrowth: companiesGrowth,
            dealsGrowth: dealsGrowth,
            revenueGrowth: revenueGrowth,
          },
          activities: sortedActivities,
          topDeals: formattedTopDeals,
          charts: {
            monthlyRevenue: monthlyRevenueData,
            dealsByStage: dealsByStage,
          },
        };

        console.log(
          `✅ Dashboard data fetched for user ${
            payload.userId
          } - totalContacts: ${contactsCount} (${
            contactsGrowth >= 0 ? "+" : ""
          }${contactsGrowth}%), activeDeals: ${activeDealsCount} (${
            dealsGrowth >= 0 ? "+" : ""
          }${dealsGrowth}%), monthlyRevenue: $${monthlyRevenue} (${
            revenueGrowth >= 0 ? "+" : ""
          }${revenueGrowth}%), activities: ${
            sortedActivities.length
          } from database`
        );

        sendJSON({
          success: true,
          data: dashboardData,
        });
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        sendJSON(
          {
            success: false,
            message: "Failed to fetch dashboard data",
          },
          500
        );
      }
    })();
    return;
  }

  // Contacts endpoint
  if (pathname === "/api/contacts" && req.method === "GET") {
    if (!db) {
      return sendJSON(
        {
          success: false,
          message: "Database connection not available",
        },
        500
      );
    }

    (async () => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return sendJSON(
            {
              success: false,
              message: "Authorization header required",
            },
            401
          );
        }

        const token = authHeader.replace("Bearer ", "");
        const decoded = verifyToken(token);

        if (!decoded) {
          return sendJSON(
            {
              success: false,
              message: "Invalid token",
            },
            401
          );
        }

        // Get query parameters for pagination and search
        const { search = "", page = "1", limit = "10" } = parsedUrl.query;
        const pageNum = sanitizeNumber(page, 1);
        const limitNum = sanitizeNumber(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const sanitizedSearch = sanitizeSearchQuery(search);

        // Build search query
        let query = { organizationId: decoded.organizationId };
        if (sanitizedSearch) {
          query.$or = [
            { firstName: { $regex: sanitizedSearch, $options: "i" } },
            { lastName: { $regex: sanitizedSearch, $options: "i" } },
            { email: { $regex: sanitizedSearch, $options: "i" } },
            { jobTitle: { $regex: sanitizedSearch, $options: "i" } },
          ];
        }

        // Fetch contacts with company lookup using aggregation
        const contactsWithCompany = await db
          .collection("contacts")
          .aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limitNum },
            {
              $lookup: {
                from: "companies",
                localField: "companyId",
                foreignField: "_id",
                as: "companyData",
              },
            },
            {
              $addFields: {
                company: { $arrayElemAt: ["$companyData", 0] },
              },
            },
            {
              $project: {
                companyData: 0, // Remove the temporary array
              },
            },
          ])
          .toArray();

        // Get total count for pagination
        const totalCount = await db
          .collection("contacts")
          .countDocuments(query);

        // If no contacts exist for this organization, seed sample data
        if (totalCount === 0) {
          console.log(
            "🌱 No contacts found, seeding sample data for organization:",
            decoded.organizationId
          );
          await seedCompanies(decoded.organizationId);
          await seedContacts(decoded.organizationId);
          await seedDeals(decoded.organizationId);

          // Re-fetch contacts after seeding with company lookup
          const seededContactsWithCompany = await db
            .collection("contacts")
            .aggregate([
              { $match: query },
              { $sort: { createdAt: -1 } },
              { $skip: skip },
              { $limit: limitNum },
              {
                $lookup: {
                  from: "companies",
                  localField: "companyId",
                  foreignField: "_id",
                  as: "companyData",
                },
              },
              {
                $addFields: {
                  company: { $arrayElemAt: ["$companyData", 0] },
                },
              },
              {
                $project: {
                  companyData: 0,
                },
              },
            ])
            .toArray();

          const seededTotalCount = await db
            .collection("contacts")
            .countDocuments(query);

          // Transform seeded contacts
          const transformedSeededContacts = seededContactsWithCompany.map(
            (contact) => ({
              _id: contact._id.toString(),
              name: `${contact.firstName} ${contact.lastName}`,
              email: contact.email,
              phone: contact.phone || "",
              company: contact.company ? contact.company.name : "No company",
              companyId: contact.companyId
                ? contact.companyId.toString()
                : null,
              jobTitle: contact.jobTitle || "",
              status: contact.status || "active",
              tags: contact.tags || [],
              lastContact: contact.lastContact || contact.createdAt,
              createdAt: contact.createdAt,
              updatedAt: contact.updatedAt,
            })
          );

          console.log(
            `✅ Contacts seeded and fetched from MongoDB for organization ${decoded.organizationId}: ${seededContactsWithCompany.length} contacts`
          );

          return sendJSON({
            success: true,
            data: {
              contacts: transformedSeededContacts,
              pagination: {
                page: pageNum,
                limit: limitNum,
                total: seededTotalCount,
                pages: Math.ceil(seededTotalCount / limitNum),
              },
            },
          });
        }

        // Transform contacts to match frontend expectations
        const transformedContacts = contactsWithCompany.map((contact) => ({
          _id: contact._id.toString(),
          name: `${contact.firstName} ${contact.lastName}`,
          email: contact.email,
          phone: contact.phone || "",
          company: contact.company ? contact.company.name : "No company",
          companyId: contact.companyId ? contact.companyId.toString() : null,
          jobTitle: contact.jobTitle || "",
          status: contact.status || "active",
          tags: contact.tags || [],
          lastContact: contact.lastContact || contact.createdAt,
          createdAt: contact.createdAt,
          updatedAt: contact.updatedAt,
        }));

        console.log(
          `✅ Contacts fetched from MongoDB for organization ${decoded.organizationId}: ${contactsWithCompany.length} contacts`
        );

        sendJSON({
          success: true,
          data: {
            contacts: transformedContacts,
            pagination: {
              page: pageNum,
              limit: limitNum,
              total: totalCount,
              pages: Math.ceil(totalCount / limitNum),
            },
          },
        });
      } catch (error) {
        console.error("Contacts fetch error:", error);
        sendJSON(
          {
            success: false,
            message: "Failed to fetch contacts",
          },
          500
        );
      }
    })();
    return;
  }

  // Update contact endpoint (PUT /api/contacts/:id)
  if (pathname.startsWith("/api/contacts/") && req.method === "PUT") {
    if (!db) {
      return sendJSON(
        {
          success: false,
          message: "Database connection not available",
        },
        500
      );
    }

    const contactId = pathname.split("/")[3];
    if (!contactId || !ObjectId.isValid(contactId)) {
      return sendJSON(
        {
          success: false,
          message: "Invalid contact ID",
        },
        400
      );
    }

    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return sendJSON(
            {
              success: false,
              message: "Authorization header required",
            },
            401
          );
        }

        const token = authHeader.replace("Bearer ", "");
        const decoded = verifyToken(token);

        if (!decoded) {
          return sendJSON(
            {
              success: false,
              message: "Invalid token",
            },
            401
          );
        }

        const updateData = JSON.parse(body);

        // Build update object
        const updateFields = {};
        if (updateData.name) {
          const nameParts = updateData.name.split(" ");
          updateFields.firstName = nameParts[0] || "";
          updateFields.lastName = nameParts.slice(1).join(" ") || "";
        }
        if (updateData.email) updateFields.email = updateData.email;
        if (updateData.phone) updateFields.phone = updateData.phone;
        if (updateData.jobTitle) updateFields.jobTitle = updateData.jobTitle;
        if (updateData.status) updateFields.status = updateData.status;

        // Handle company selection - convert companyId string to ObjectId
        if (updateData.hasOwnProperty("companyId")) {
          if (updateData.companyId && updateData.companyId !== "") {
            try {
              updateFields.companyId = new ObjectId(updateData.companyId);
            } catch (error) {
              return sendJSON(
                {
                  success: false,
                  message: "Invalid company ID format",
                },
                400
              );
            }
          } else {
            updateFields.companyId = null;
          }
        }

        updateFields.updatedAt = new Date();

        // Update contact in database
        const result = await db.collection("contacts").updateOne(
          {
            _id: new ObjectId(contactId),
            organizationId: decoded.organizationId,
          },
          { $set: updateFields }
        );

        if (result.matchedCount === 0) {
          return sendJSON(
            {
              success: false,
              message: "Contact not found",
            },
            404
          );
        }

        console.log(
          `✅ Contact updated: ${contactId} for organization ${decoded.organizationId}`
        );

        sendJSON({
          success: true,
          message: "Contact updated successfully",
          data: {
            contactId,
            updatedFields: Object.keys(updateFields),
          },
        });
      } catch (error) {
        console.error("Contact update error:", error);
        sendJSON(
          {
            success: false,
            message: "Failed to update contact",
          },
          500
        );
      }
    });
    return;
  }

  // Delete contact endpoint (DELETE /api/contacts/:id)
  if (pathname.startsWith("/api/contacts/") && req.method === "DELETE") {
    if (!db) {
      return sendJSON(
        {
          success: false,
          message: "Database connection not available",
        },
        500
      );
    }

    const contactId = pathname.split("/")[3];
    if (!contactId || !ObjectId.isValid(contactId)) {
      return sendJSON(
        {
          success: false,
          message: "Invalid contact ID",
        },
        400
      );
    }

    (async () => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return sendJSON(
            {
              success: false,
              message: "Authorization header required",
            },
            401
          );
        }

        const token = authHeader.replace("Bearer ", "");
        const decoded = verifyToken(token);

        if (!decoded) {
          return sendJSON(
            {
              success: false,
              message: "Invalid token",
            },
            401
          );
        }

        // Delete contact from database
        const result = await db.collection("contacts").deleteOne({
          _id: new ObjectId(contactId),
          organizationId: decoded.organizationId,
        });

        if (result.deletedCount === 0) {
          return sendJSON(
            {
              success: false,
              message: "Contact not found",
            },
            404
          );
        }

        console.log(
          `✅ Contact deleted: ${contactId} for organization ${decoded.organizationId}`
        );

        sendJSON({
          success: true,
          message: "Contact deleted successfully",
          data: {
            contactId,
          },
        });
      } catch (error) {
        console.error("Contact delete error:", error);
        sendJSON(
          {
            success: false,
            message: "Failed to delete contact",
          },
          500
        );
      }
    })();
    return;
  }

  // Create contact endpoint (POST /api/contacts)
  if (pathname === "/api/contacts" && req.method === "POST") {
    if (!db) {
      return sendJSON(
        {
          success: false,
          message: "Database connection not available",
        },
        500
      );
    }

    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return sendJSON(
            {
              success: false,
              message: "Authorization header required",
            },
            401
          );
        }

        const token = authHeader.replace("Bearer ", "");
        const decoded = verifyToken(token);

        if (!decoded) {
          return sendJSON(
            {
              success: false,
              message: "Invalid token",
            },
            401
          );
        }

        const contactData = JSON.parse(body);

        // Sanitize and validate required fields
        const sanitizedName = sanitizeText(contactData.name || "", 100);
        const sanitizedEmail = sanitizeEmail(contactData.email || "");

        if (!sanitizedName || !sanitizedEmail) {
          return sendJSON(
            {
              success: false,
              message: "Name and email are required",
            },
            400
          );
        }

        // Split name into first and last name
        const nameParts = sanitizedName.split(" ");
        const firstName = sanitizeText(nameParts[0] || "", 50);
        const lastName = sanitizeText(nameParts.slice(1).join(" ") || "", 50);

        // Handle company selection - convert companyId string to ObjectId
        let companyId = null;
        if (contactData.companyId && contactData.companyId !== "") {
          try {
            companyId = new ObjectId(contactData.companyId);
          } catch (error) {
            return sendJSON(
              {
                success: false,
                message: "Invalid company ID format",
              },
              400
            );
          }
        }

        // Create new contact document
        const newContact = {
          _id: new ObjectId(),
          organizationId: decoded.organizationId,
          firstName,
          lastName,
          email: sanitizedEmail,
          phone: sanitizeText(contactData.phone || "", 20),
          companyId, // Use ObjectId reference or null
          jobTitle: sanitizeText(contactData.jobTitle || "", 100),
          status: sanitizeText(contactData.status || "active", 20),
          tags: Array.isArray(contactData.tags)
            ? contactData.tags.map((tag) => sanitizeText(tag, 50))
            : [],
          lastContact: contactData.lastContact
            ? new Date(contactData.lastContact)
            : new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Insert contact into database
        const result = await db.collection("contacts").insertOne(newContact);

        if (!result.insertedId) {
          return sendJSON(
            {
              success: false,
              message: "Failed to create contact",
            },
            500
          );
        }

        // Transform contact for response
        const transformedContact = {
          _id: newContact._id.toString(),
          name: `${newContact.firstName} ${newContact.lastName}`.trim(),
          email: newContact.email,
          phone: newContact.phone,
          company: newContact.company,
          status: newContact.status,
          lastContact: newContact.lastContact,
          createdAt: newContact.createdAt,
          updatedAt: newContact.updatedAt,
        };

        console.log(
          `✅ Contact created: ${result.insertedId} for organization ${decoded.organizationId}`
        );

        sendJSON({
          success: true,
          message: "Contact created successfully",
          data: {
            contact: transformedContact,
          },
        });
      } catch (error) {
        console.error("Contact creation error:", error);
        sendJSON(
          {
            success: false,
            message: "Failed to create contact",
          },
          500
        );
      }
    });
    return;
  }

  // Companies endpoints
  // GET /api/companies - Get companies with pagination and search
  if (pathname === "/api/companies" && req.method === "GET") {
    if (!db) {
      return sendJSON(
        {
          success: false,
          message: "Database connection not available",
        },
        500
      );
    }

    (async () => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return sendJSON(
            {
              success: false,
              message: "Authorization header required",
            },
            401
          );
        }

        const token = authHeader.replace("Bearer ", "");
        const decoded = verifyToken(token);

        if (!decoded) {
          return sendJSON(
            {
              success: false,
              message: "Invalid token",
            },
            401
          );
        }

        const query = url.parse(req.url, true).query;
        const page = sanitizeNumber(query.page, 1);
        const limit = sanitizeNumber(query.limit, 10);
        const search = sanitizeSearchQuery(query.search || "");
        const industry = sanitizeText(query.industry || "", 100);
        const status = sanitizeText(query.status || "", 50);

        const skip = (page - 1) * limit;

        // Build filter
        let filter = { organizationId: decoded.organizationId };

        if (search) {
          filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { website: { $regex: search, $options: "i" } },
            { location: { $regex: search, $options: "i" } },
          ];
        }

        if (industry) {
          filter.industry = industry;
        }

        if (status) {
          filter.status = status;
        }

        console.log(`📥 Fetching companies with filter:`, filter);

        // Use aggregation to get companies with real contact counts
        const companiesWithContactCounts = await db
          .collection("companies")
          .aggregate([
            { $match: filter },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: "contacts",
                let: { companyId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$companyId", "$$companyId"] },
                    },
                  },
                  { $count: "count" },
                ],
                as: "contactCounts",
              },
            },
            {
              $addFields: {
                realContactCount: {
                  $ifNull: [{ $arrayElemAt: ["$contactCounts.count", 0] }, 0],
                },
              },
            },
            {
              $project: {
                contactCounts: 0,
              },
            },
          ])
          .toArray();

        const total = await db.collection("companies").countDocuments(filter);

        const transformedCompanies = companiesWithContactCounts.map(
          (company) => ({
            id: company._id.toString(),
            name: company.name,
            website: company.website,
            industry: company.industry,
            size: company.size,
            revenue: company.revenue,
            location: company.location,
            primaryContact: company.primaryContact,
            contactCount: company.realContactCount, // Use real count from aggregation
            dealCount: company.dealCount || 0,
            lastActivity: company.lastActivity,
            status: company.status,
            createdAt: company.createdAt,
            updatedAt: company.updatedAt,
          })
        );

        sendJSON({
          success: true,
          data: {
            companies: transformedCompanies,
            pagination: {
              page,
              limit,
              total,
              pages: Math.ceil(total / limit),
            },
          },
        });
      } catch (error) {
        console.error("Companies fetch error:", error);
        sendJSON(
          {
            success: false,
            message: "Failed to fetch companies",
          },
          500
        );
      }
    })();
    return;
  }

  // POST /api/companies - Create new company
  if (pathname === "/api/companies" && req.method === "POST") {
    if (!db) {
      return sendJSON(
        {
          success: false,
          message: "Database connection not available",
        },
        500
      );
    }

    (async () => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return sendJSON(
            {
              success: false,
              message: "Authorization header required",
            },
            401
          );
        }

        const token = authHeader.replace("Bearer ", "");
        const decoded = verifyToken(token);

        if (!decoded) {
          return sendJSON(
            {
              success: false,
              message: "Invalid token",
            },
            401
          );
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });

        req.on("end", async () => {
          try {
            const companyData = JSON.parse(body);

            // Validate required fields
            if (!companyData.name) {
              return sendJSON(
                {
                  success: false,
                  message: "Company name is required",
                },
                400
              );
            }

            const newCompany = {
              _id: new ObjectId(),
              organizationId: decoded.organizationId,
              name: companyData.name,
              website: companyData.website || "",
              industry: companyData.industry || "",
              size: companyData.size || "small",
              revenue: companyData.revenue || 0,
              location: companyData.location || "",
              primaryContact: companyData.primaryContact || "",
              contactCount: 0,
              dealCount: 0,
              lastActivity: new Date().toISOString().split("T")[0],
              status: companyData.status || "prospect",
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const result = await db
              .collection("companies")
              .insertOne(newCompany);

            const transformedCompany = {
              id: result.insertedId.toString(),
              name: newCompany.name,
              website: newCompany.website,
              industry: newCompany.industry,
              size: newCompany.size,
              revenue: newCompany.revenue,
              location: newCompany.location,
              primaryContact: newCompany.primaryContact,
              contactCount: newCompany.contactCount,
              dealCount: newCompany.dealCount,
              lastActivity: newCompany.lastActivity,
              status: newCompany.status,
              createdAt: newCompany.createdAt,
              updatedAt: newCompany.updatedAt,
            };

            console.log(
              `✅ Company created: ${result.insertedId} for organization ${decoded.organizationId}`
            );

            sendJSON({
              success: true,
              message: "Company created successfully",
              data: {
                company: transformedCompany,
              },
            });
          } catch (parseError) {
            console.error("Company creation parse error:", parseError);
            sendJSON(
              {
                success: false,
                message: "Invalid JSON data",
              },
              400
            );
          }
        });
      } catch (error) {
        console.error("Company creation error:", error);
        sendJSON(
          {
            success: false,
            message: "Failed to create company",
          },
          500
        );
      }
    })();
    return;
  }

  // PUT /api/companies/:id - Update company
  if (pathname.startsWith("/api/companies/") && req.method === "PUT") {
    if (!db) {
      return sendJSON(
        {
          success: false,
          message: "Database connection not available",
        },
        500
      );
    }

    (async () => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return sendJSON(
            {
              success: false,
              message: "Authorization header required",
            },
            401
          );
        }

        const token = authHeader.replace("Bearer ", "");
        const decoded = verifyToken(token);

        if (!decoded) {
          return sendJSON(
            {
              success: false,
              message: "Invalid token",
            },
            401
          );
        }

        // Extract company ID from URL
        const companyId = pathname.split("/")[3];
        if (!companyId) {
          return sendJSON(
            {
              success: false,
              message: "Company ID is required",
            },
            400
          );
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });

        req.on("end", async () => {
          try {
            const companyData = JSON.parse(body);

            // Validate required fields
            const requiredFields = ["name", "industry", "size", "location"];
            for (const field of requiredFields) {
              if (!companyData[field]) {
                return sendJSON(
                  {
                    success: false,
                    message: `${field} is required`,
                  },
                  400
                );
              }
            }

            // Check if company exists and belongs to the organization
            const existingCompany = await db.collection("companies").findOne({
              _id: new ObjectId(companyId),
              organizationId: decoded.organizationId,
            });

            if (!existingCompany) {
              return sendJSON(
                {
                  success: false,
                  message: "Company not found",
                },
                404
              );
            }

            // Prepare update data
            const updateData = {
              name: companyData.name,
              website: companyData.website || "",
              industry: companyData.industry,
              size: companyData.size,
              revenue: companyData.revenue || 0,
              location: companyData.location,
              primaryContact: companyData.primaryContact || "",
              status: companyData.status || "active",
              updatedAt: new Date(),
            };

            // Update the company
            const result = await db.collection("companies").updateOne(
              {
                _id: new ObjectId(companyId),
                organizationId: decoded.organizationId,
              },
              { $set: updateData }
            );

            if (result.matchedCount === 0) {
              return sendJSON(
                {
                  success: false,
                  message: "Company not found",
                },
                404
              );
            }

            // Fetch the updated company
            const updatedCompany = await db.collection("companies").findOne({
              _id: new ObjectId(companyId),
              organizationId: decoded.organizationId,
            });

            console.log(`✅ Company updated: ${companyData.name}`);

            sendJSON({
              success: true,
              message: "Company updated successfully",
              data: {
                company: {
                  id: updatedCompany._id.toString(),
                  ...updatedCompany,
                  _id: undefined,
                },
              },
            });
          } catch (parseError) {
            console.error("JSON parse error:", parseError);
            sendJSON(
              {
                success: false,
                message: "Invalid JSON data",
              },
              400
            );
          }
        });
      } catch (error) {
        console.error("Company update error:", error);
        sendJSON(
          {
            success: false,
            message: "Failed to update company",
          },
          500
        );
      }
    })();
    return;
  }

  // DELETE /api/companies/:id - Delete company
  if (pathname.startsWith("/api/companies/") && req.method === "DELETE") {
    if (!db) {
      return sendJSON(
        {
          success: false,
          message: "Database connection not available",
        },
        500
      );
    }

    (async () => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return sendJSON(
            {
              success: false,
              message: "Authorization header required",
            },
            401
          );
        }

        const token = authHeader.replace("Bearer ", "");
        const decoded = verifyToken(token);

        if (!decoded) {
          return sendJSON(
            {
              success: false,
              message: "Invalid token",
            },
            401
          );
        }

        // Extract company ID from URL
        const companyId = pathname.split("/")[3];
        if (!companyId) {
          return sendJSON(
            {
              success: false,
              message: "Company ID is required",
            },
            400
          );
        }

        // Check if company exists and belongs to the organization
        const existingCompany = await db.collection("companies").findOne({
          _id: new ObjectId(companyId),
          organizationId: decoded.organizationId,
        });

        if (!existingCompany) {
          return sendJSON(
            {
              success: false,
              message: "Company not found",
            },
            404
          );
        }

        // Check if company has associated contacts
        const contactCount = await db.collection("contacts").countDocuments({
          companyId: new ObjectId(companyId),
          organizationId: decoded.organizationId,
        });

        if (contactCount > 0) {
          return sendJSON(
            {
              success: false,
              message: `Cannot delete company. It has ${contactCount} associated contact${
                contactCount > 1 ? "s" : ""
              }. Please reassign or delete the contacts first.`,
            },
            400
          );
        }

        // Delete the company
        const result = await db.collection("companies").deleteOne({
          _id: new ObjectId(companyId),
          organizationId: decoded.organizationId,
        });

        if (result.deletedCount === 0) {
          return sendJSON(
            {
              success: false,
              message: "Company not found",
            },
            404
          );
        }

        console.log(
          `✅ Company deleted: ${existingCompany.name} (${companyId})`
        );

        sendJSON({
          success: true,
          message: "Company deleted successfully",
          data: {
            deletedCompany: {
              id: companyId,
              name: existingCompany.name,
            },
          },
        });
      } catch (error) {
        console.error("Company deletion error:", error);
        sendJSON(
          {
            success: false,
            message: "Failed to delete company",
          },
          500
        );
      }
    })();
    return;
  }

  // GET /api/companies/list - Get all companies for dropdown selection (simplified)
  if (pathname === "/api/companies/list" && req.method === "GET") {
    if (!db) {
      return sendJSON(
        {
          success: false,
          message: "Database connection not available",
        },
        500
      );
    }

    (async () => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return sendJSON(
            {
              success: false,
              message: "Authorization header required",
            },
            401
          );
        }

        const token = authHeader.replace("Bearer ", "");
        const decoded = verifyToken(token);

        if (!decoded) {
          return sendJSON(
            {
              success: false,
              message: "Invalid token",
            },
            401
          );
        }

        // Get all companies for this organization (simplified for dropdown)
        const companies = await db
          .collection("companies")
          .find(
            { organizationId: decoded.organizationId },
            {
              projection: {
                _id: 1,
                name: 1,
                industry: 1,
                website: 1,
              },
            }
          )
          .sort({ name: 1 })
          .toArray();

        const transformedCompanies = companies.map((company) => ({
          id: company._id.toString(),
          name: company.name,
          industry: company.industry || "",
          website: company.website || "",
        }));

        sendJSON({
          success: true,
          data: {
            companies: transformedCompanies,
          },
        });
      } catch (error) {
        console.error("Companies list fetch error:", error);
        sendJSON(
          {
            success: false,
            message: "Failed to fetch companies list",
          },
          500
        );
      }
    })();
    return;
  }

  // GET /api/deals - Get deals with pagination and search
  if (pathname === "/api/deals" && req.method === "GET") {
    if (!db) {
      return sendJSON(
        {
          success: false,
          message: "Database connection not available",
        },
        500
      );
    }

    (async () => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return sendJSON(
            {
              success: false,
              message: "Authorization header required",
            },
            401
          );
        }

        const token = authHeader.replace("Bearer ", "");
        const decoded = verifyToken(token);

        if (!decoded) {
          return sendJSON(
            {
              success: false,
              message: "Invalid token",
            },
            401
          );
        }

        const queryObject = url.parse(req.url, true).query;
        const page = parseInt(queryObject.page) || 1;
        const limit = parseInt(queryObject.limit) || 10;
        const skip = (page - 1) * limit;
        const search = sanitizeSearchQuery(queryObject.search || "");
        const stage = sanitizeText(queryObject.stage || "", 50);
        const activeOnly = queryObject.activeOnly === "true";

        // Build search filter
        const searchFilter = {
          organizationId: decoded.organizationId,
        };

        if (search) {
          searchFilter.$or = [
            { title: { $regex: search, $options: "i" } },
            { company: { $regex: search, $options: "i" } },
            { contactName: { $regex: search, $options: "i" } },
          ];
        }

        if (activeOnly) {
          // Show only active deals (exclude closed deals)
          searchFilter.stage = { $nin: ["closed-won", "closed-lost"] };
        } else if (stage) {
          searchFilter.stage = stage;
        }

        const deals = await db
          .collection("deals")
          .find(searchFilter)
          .sort({ value: -1 })
          .skip(skip)
          .limit(limit)
          .toArray();

        const totalDeals = await db
          .collection("deals")
          .countDocuments(searchFilter);

        const totalPages = Math.ceil(totalDeals / limit);

        const transformedDeals = deals.map((deal) => ({
          id: deal._id.toString(),
          title: deal.title,
          company: deal.company,
          contactName: deal.contactName,
          value: deal.value,
          probability: deal.probability,
          stage: deal.stage,
          expectedCloseDate: deal.expectedCloseDate,
          lastActivity: deal.lastActivity,
          createdAt: deal.createdAt,
          updatedAt: deal.updatedAt,
        }));

        sendJSON({
          success: true,
          data: {
            deals: transformedDeals,
            pagination: {
              page,
              limit,
              total: totalDeals,
              pages: totalPages,
            },
          },
        });
      } catch (error) {
        console.error("Error fetching deals:", error);
        sendJSON(
          {
            success: false,
            message: "Failed to fetch deals",
          },
          500
        );
      }
    })();
    return;
  }

  // POST /api/deals - Create new deal
  if (pathname === "/api/deals" && req.method === "POST") {
    if (!db) {
      return sendJSON(
        {
          success: false,
          message: "Database connection not available",
        },
        500
      );
    }

    (async () => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return sendJSON(
            {
              success: false,
              message: "Authorization header required",
            },
            401
          );
        }

        const token = authHeader.replace("Bearer ", "");
        const decoded = verifyToken(token);

        if (!decoded) {
          return sendJSON(
            {
              success: false,
              message: "Invalid token",
            },
            401
          );
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });

        req.on("end", async () => {
          try {
            const dealData = JSON.parse(body);

            // Validate required fields
            if (!dealData.title) {
              return sendJSON(
                {
                  success: false,
                  message: "Deal title is required",
                },
                400
              );
            }

            const newDeal = {
              _id: new ObjectId(),
              organizationId: decoded.organizationId,
              title: dealData.title,
              company: dealData.company || "",
              contactName: dealData.contactName || "",
              value: dealData.value || 0,
              probability: dealData.probability || 50,
              stage: dealData.stage || "lead",
              expectedCloseDate:
                dealData.expectedCloseDate ||
                new Date().toISOString().split("T")[0],
              lastActivity: new Date().toISOString().split("T")[0],
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const result = await db.collection("deals").insertOne(newDeal);

            const transformedDeal = {
              id: result.insertedId.toString(),
              title: newDeal.title,
              company: newDeal.company,
              contactName: newDeal.contactName,
              value: newDeal.value,
              probability: newDeal.probability,
              stage: newDeal.stage,
              expectedCloseDate: newDeal.expectedCloseDate,
              lastActivity: newDeal.lastActivity,
              createdAt: newDeal.createdAt,
              updatedAt: newDeal.updatedAt,
            };

            console.log(
              `✅ Deal created: ${result.insertedId} for organization ${decoded.organizationId}`
            );

            sendJSON({
              success: true,
              message: "Deal created successfully",
              data: {
                deal: transformedDeal,
              },
            });
          } catch (parseError) {
            console.error("Deal creation parse error:", parseError);
            sendJSON(
              {
                success: false,
                message: "Invalid JSON data",
              },
              400
            );
          }
        });
      } catch (error) {
        console.error("Deal creation error:", error);
        sendJSON(
          {
            success: false,
            message: "Failed to create deal",
          },
          500
        );
      }
    })();
    return;
  }

  // PUT /api/deals/:id - Update deal
  if (pathname.startsWith("/api/deals/") && req.method === "PUT") {
    if (!db) {
      return sendJSON(
        {
          success: false,
          message: "Database connection not available",
        },
        500
      );
    }

    (async () => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return sendJSON(
            {
              success: false,
              message: "Authorization header required",
            },
            401
          );
        }

        const token = authHeader.replace("Bearer ", "");
        const decoded = verifyToken(token);

        if (!decoded) {
          return sendJSON(
            {
              success: false,
              message: "Invalid token",
            },
            401
          );
        }

        const dealId = pathname.split("/api/deals/")[1];

        if (!ObjectId.isValid(dealId)) {
          return sendJSON(
            {
              success: false,
              message: "Invalid deal ID format",
            },
            400
          );
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });

        req.on("end", async () => {
          try {
            const updateData = JSON.parse(body);

            // Check if deal exists and belongs to user's organization
            const existingDeal = await db.collection("deals").findOne({
              _id: new ObjectId(dealId),
              organizationId: decoded.organizationId,
            });

            if (!existingDeal) {
              return sendJSON(
                {
                  success: false,
                  message: "Deal not found",
                },
                404
              );
            }

            // Prepare update object
            const updateFields = {
              ...updateData,
              updatedAt: new Date(),
            };

            // Remove fields that shouldn't be updated directly
            delete updateFields.id;
            delete updateFields._id;
            delete updateFields.organizationId;
            delete updateFields.createdAt;

            const result = await db.collection("deals").updateOne(
              {
                _id: new ObjectId(dealId),
                organizationId: decoded.organizationId,
              },
              { $set: updateFields }
            );

            if (result.matchedCount === 0) {
              return sendJSON(
                {
                  success: false,
                  message: "Deal not found or access denied",
                },
                404
              );
            }

            console.log(
              `✅ Deal updated: ${dealId} for organization ${decoded.organizationId}`
            );

            sendJSON({
              success: true,
              message: "Deal updated successfully",
            });
          } catch (parseError) {
            console.error("Deal update parse error:", parseError);
            sendJSON(
              {
                success: false,
                message: "Invalid JSON data",
              },
              400
            );
          }
        });
      } catch (error) {
        console.error("Deal update error:", error);
        sendJSON(
          {
            success: false,
            message: "Failed to update deal",
          },
          500
        );
      }
    })();
    return;
  }

  // DELETE /api/deals/:id - Delete deal
  if (pathname.startsWith("/api/deals/") && req.method === "DELETE") {
    if (!db) {
      return sendJSON(
        {
          success: false,
          message: "Database connection not available",
        },
        500
      );
    }

    (async () => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return sendJSON(
            {
              success: false,
              message: "Authorization header required",
            },
            401
          );
        }

        const token = authHeader.replace("Bearer ", "");
        const decoded = verifyToken(token);

        if (!decoded) {
          return sendJSON(
            {
              success: false,
              message: "Invalid token",
            },
            401
          );
        }

        const dealId = pathname.split("/api/deals/")[1];

        if (!ObjectId.isValid(dealId)) {
          return sendJSON(
            {
              success: false,
              message: "Invalid deal ID format",
            },
            400
          );
        }

        // Check if deal exists and belongs to user's organization
        const existingDeal = await db.collection("deals").findOne({
          _id: new ObjectId(dealId),
          organizationId: decoded.organizationId,
        });

        if (!existingDeal) {
          return sendJSON(
            {
              success: false,
              message: "Deal not found",
            },
            404
          );
        }

        const result = await db.collection("deals").deleteOne({
          _id: new ObjectId(dealId),
          organizationId: decoded.organizationId,
        });

        if (result.deletedCount === 0) {
          return sendJSON(
            {
              success: false,
              message: "Deal not found or access denied",
            },
            404
          );
        }

        console.log(
          `✅ Deal deleted: ${dealId} for organization ${decoded.organizationId}`
        );

        sendJSON({
          success: true,
          message: "Deal deleted successfully",
        });
      } catch (error) {
        console.error("Deal delete error:", error);
        sendJSON(
          {
            success: false,
            message: "Failed to delete deal",
          },
          500
        );
      }
    })();
    return;
  }

  // POST /api/auth/forgot-password - Send password reset email
  if (pathname === "/api/auth/forgot-password" && req.method === "POST") {
    if (!db) {
      return sendJSON(
        {
          success: false,
          message: "Database connection not available",
        },
        500
      );
    }

    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const { email } = JSON.parse(body);

        if (!email) {
          return sendJSON(
            {
              success: false,
              message: "Email is required",
            },
            400
          );
        }

        // Always return success to prevent email enumeration attacks
        const response = {
          success: true,
          message:
            "If an account with that email exists, we have sent a password reset link.",
        };

        // Check if user exists
        const user = await db.collection("users").findOne({
          email: email.toLowerCase(),
        });

        if (user) {
          // Generate reset token
          const resetToken = require("crypto").randomBytes(32).toString("hex");
          const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

          // Store token in memory (in production, use database)
          passwordResetTokens.set(resetToken, {
            email: email.toLowerCase(),
            expires,
            userId: user._id.toString(),
          });

          const resetUrl = `${
            process.env.FRONTEND_URL || "http://localhost:5174"
          }/reset-password?token=${resetToken}`;
          const userName = `${user.firstName} ${user.lastName}`;

          console.log(
            `🔐 Password reset token generated for ${email}: ${resetToken}`
          );
          console.log(`🔗 Reset URL: ${resetUrl}`);

          // Check if email is configured for production
          const emailConfigured =
            process.env.SMTP_USER &&
            process.env.SMTP_PASS &&
            !process.env.SMTP_USER.includes("your-email") &&
            !process.env.SMTP_PASS.includes("your-") &&
            process.env.SMTP_PASS !== "your-resend-api-key" &&
            process.env.SMTP_PASS !== "your-sendgrid-api-key";

          if (emailConfigured) {
            console.log(
              `📧 PRODUCTION EMAIL: Attempting to send via ${process.env.SMTP_HOST} to ${email}`
            );

            // Use nodemailer to send actual email
            const nodemailer = require("nodemailer");

            // Configure transporter based on provider
            let transporterConfig = {
              host: process.env.SMTP_HOST || "smtp.resend.com",
              port: parseInt(process.env.SMTP_PORT || "587", 10),
              secure: process.env.SMTP_SECURE === "true",
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              },
            };

            // Special handling for Resend
            if (process.env.SMTP_HOST === "smtp.resend.com") {
              console.log("🔥 Using Resend for email delivery");
            }

            const transporter = nodemailer.createTransport(transporterConfig);

            const emailTemplate = createPasswordResetEmailTemplate(
              userName,
              resetUrl,
              resetToken
            );

            const mailOptions = {
              from: `"${process.env.EMAIL_FROM_NAME || "CRM Platform"}" <${
                process.env.EMAIL_FROM_ADDRESS || "onboarding@resend.dev"
              }>`,
              to: email,
              subject: emailTemplate.subject,
              html: emailTemplate.html,
              text: emailTemplate.text,
            };

            transporter
              .sendMail(mailOptions)
              .then((info) => {
                console.log(`✅ EMAIL SENT SUCCESSFULLY!`);
                console.log(`   Provider: ${process.env.SMTP_HOST}`);
                console.log(`   To: ${email}`);
                console.log(`   Message ID: ${info.messageId}`);
                console.log(`   Response: ${info.response}`);
              })
              .catch((error) => {
                console.error(`❌ EMAIL DELIVERY FAILED:`);
                console.error(`   Provider: ${process.env.SMTP_HOST}`);
                console.error(`   To: ${email}`);
                console.error(`   Error: ${error.message}`);
                console.error(`   Full Error:`, error);
              });
          } else {
            console.log(
              `⚠️  EMAIL NOT CONFIGURED: Please set production SMTP credentials in .env file`
            );
            console.log(`📧 DEMO MODE: Email would be sent to ${email}`);
            console.log(`   Reset Token: ${resetToken}`);
            console.log(`   Expires: ${expires.toISOString()}`);
            console.log(`   Manual Test URL: ${resetUrl}`);
          }
        }

        sendJSON(response);
      } catch (error) {
        console.error("Forgot password error:", error);
        sendJSON(
          {
            success: false,
            message: "Failed to process password reset request",
          },
          500
        );
      }
    });
    return;
  }

  // GET /api/auth/verify-reset-token/:token - Verify password reset token
  if (
    pathname.startsWith("/api/auth/verify-reset-token/") &&
    req.method === "GET"
  ) {
    const token = pathname.split("/api/auth/verify-reset-token/")[1];

    if (!token) {
      return sendJSON(
        {
          valid: false,
          message: "Token is required",
        },
        400
      );
    }

    const tokenData = passwordResetTokens.get(token);

    if (!tokenData) {
      return sendJSON(
        {
          valid: false,
          message: "Invalid reset token",
        },
        400
      );
    }

    if (new Date() > tokenData.expires) {
      passwordResetTokens.delete(token);
      return sendJSON(
        {
          valid: false,
          message: "Reset token has expired",
        },
        400
      );
    }

    sendJSON({
      valid: true,
      message: "Token is valid",
    });
    return;
  }

  // POST /api/auth/reset-password - Reset password using token
  if (pathname === "/api/auth/reset-password" && req.method === "POST") {
    if (!db) {
      return sendJSON(
        {
          success: false,
          message: "Database connection not available",
        },
        500
      );
    }

    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const { token, password } = JSON.parse(body);

        if (!token || !password) {
          return sendJSON(
            {
              success: false,
              message: "Token and password are required",
            },
            400
          );
        }

        if (password.length < 6) {
          return sendJSON(
            {
              success: false,
              message: "Password must be at least 6 characters long",
            },
            400
          );
        }

        const tokenData = passwordResetTokens.get(token);

        if (!tokenData) {
          return sendJSON(
            {
              success: false,
              message: "Invalid or expired reset token",
            },
            400
          );
        }

        if (new Date() > tokenData.expires) {
          passwordResetTokens.delete(token);
          return sendJSON(
            {
              success: false,
              message: "Reset token has expired",
            },
            400
          );
        }

        // Find user
        const user = await db.collection("users").findOne({
          _id: new ObjectId(tokenData.userId),
        });

        if (!user) {
          return sendJSON(
            {
              success: false,
              message: "User not found",
            },
            400
          );
        }

        // Update user password with bcrypt
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        await db.collection("users").updateOne(
          { _id: new ObjectId(tokenData.userId) },
          {
            $set: {
              password: hashedPassword,
              updatedAt: new Date(),
            },
          }
        );

        // Remove used token
        passwordResetTokens.delete(token);

        console.log(`✅ Password reset successful for ${tokenData.email}`);

        sendJSON({
          success: true,
          message: "Password has been reset successfully",
        });
      } catch (error) {
        console.error("Reset password error:", error);
        sendJSON(
          {
            success: false,
            message: "Failed to reset password",
          },
          500
        );
      }
    });
    return;
  }

  // POST /api/auth/change-password - Change user password (requires authentication)
  if (pathname === "/api/auth/change-password" && req.method === "POST") {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendJSON(
        {
          success: false,
          message: "Authentication token required",
        },
        401
      );
    }

    const token = authHeader.split(" ")[1];
    let userId;

    try {
      // Verify JWT token (simplified verification)
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64").toString()
      );
      userId = payload.userId;
    } catch (error) {
      return sendJSON(
        {
          success: false,
          message: "Invalid authentication token",
        },
        401
      );
    }

    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const { currentPassword, newPassword } = JSON.parse(body);

        if (!currentPassword || !newPassword) {
          return sendJSON(
            {
              success: false,
              message: "Current password and new password are required",
            },
            400
          );
        }

        if (currentPassword === newPassword) {
          return sendJSON(
            {
              success: false,
              message: "New password must be different from current password",
            },
            400
          );
        }

        // Get user from database
        const user = await db
          .collection("users")
          .findOne({ _id: new ObjectId(userId) });

        if (!user) {
          return sendJSON(
            {
              success: false,
              message: "User not found",
            },
            404
          );
        }

        // Verify current password with bcrypt
        const isCurrentPasswordValid = await bcrypt.compare(
          currentPassword,
          user.password
        );
        if (!isCurrentPasswordValid) {
          return sendJSON(
            {
              success: false,
              message: "Current password is incorrect",
            },
            400
          );
        }

        // Update password with bcrypt
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        await db.collection("users").updateOne(
          { _id: new ObjectId(userId) },
          {
            $set: {
              password: hashedNewPassword,
              updatedAt: new Date(),
            },
          }
        );

        console.log(`🔐 Password changed successfully for user: ${user.email}`);

        sendJSON({
          success: true,
          message: "Password changed successfully",
        });
      } catch (error) {
        console.error("Change password error:", error);
        sendJSON(
          {
            success: false,
            message: "Failed to change password",
          },
          500
        );
      }
    });
    return;
  }

  // 404 for other routes
  sendJSON(
    {
      success: false,
      message: "Endpoint not found",
    },
    404
  );
});

server.listen(PORT, async () => {
  console.log(`🚀 Mock API Gateway running on http://localhost:${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   POST /api/auth/register - User registration`);
  console.log(`   POST /api/auth/login - User login`);
  console.log(`   POST /api/auth/forgot-password - Send password reset email`);
  console.log(
    `   GET  /api/auth/verify-reset-token/:token - Verify reset token`
  );
  console.log(`   POST /api/auth/reset-password - Reset password with token`);
  console.log(
    `   POST /api/auth/change-password - Change user password (requires auth)`
  );
  console.log(`   GET  /api/auth/verify - Verify authentication token`);
  console.log(`   GET  /api/auth/profile - Get user profile (requires auth)`);
  console.log(
    `   PUT  /api/auth/profile - Update user profile (requires auth)`
  );
  console.log(`   GET  /api/dashboard - Get dashboard data (requires auth)`);
  console.log(
    `   GET  /api/contacts - Get contacts with pagination and search (requires auth)`
  );
  console.log(`   POST /api/contacts - Create new contact (requires auth)`);
  console.log(`   PUT  /api/contacts/:id - Update contact (requires auth)`);
  console.log(`   DELETE /api/contacts/:id - Delete contact (requires auth)`);
  console.log(
    `   GET  /api/companies - Get companies with pagination and search (requires auth)`
  );
  console.log(`   POST /api/companies - Create new company (requires auth)`);
  console.log(`   PUT  /api/companies/:id - Update company (requires auth)`);
  console.log(`   DELETE /api/companies/:id - Delete company (requires auth)`);
  console.log(
    `   GET  /api/companies/list - Get all companies for dropdown (requires auth)`
  );
  console.log(
    `   GET  /api/deals - Get deals with pagination and search (requires auth)`
  );
  console.log(`   POST /api/deals - Create new deal (requires auth)`);
  console.log(`   PUT  /api/deals/:id - Update deal (requires auth)`);
  console.log(`   DELETE /api/deals/:id - Delete deal (requires auth)`);
  console.log(`   GET  /api/health - Health check with database stats`);
  console.log(`   POST /api/contact-sales - Submit enterprise sales inquiry`);
  console.log(
    `\n💡 This server uses MongoDB for data persistence - no localStorage!`
  );
  console.log(`📊 All CRUD operations are handled through MongoDB Atlas`);

  // Connect to MongoDB
  console.log("\n🔗 Connecting to MongoDB Atlas...");
  const connected = await connectToDatabase();
  if (connected) {
    console.log(
      "✅ Database connection established - ready to accept requests"
    );

    // Ensure test user exists for testing
    try {
      const testUser = await db.collection("users").findOne({
        email: "test@example.com",
      });

      if (!testUser) {
        console.log("🧪 Creating test user for development...");

        // Check if test organization exists
        let testOrg = await db.collection("organizations").findOne({
          slug: "test-org",
        });

        if (!testOrg) {
          const testOrgId = new ObjectId();
          // Create test organization
          await db.collection("organizations").insertOne({
            _id: testOrgId,
            name: "Test Organization",
            slug: "test-org",
            plan: "premium",
            settings: {
              currency: "USD",
              timezone: "UTC",
              dateFormat: "MM/DD/YYYY",
              features: ["contacts", "deals", "companies", "reports"],
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          testOrg = { _id: testOrgId };
        }

        // Check if test user exists and has proper bcrypt hash
        const existingUser = await db
          .collection("users")
          .findOne({ email: "test@example.com" });

        if (!existingUser) {
          // Create test user
          const hashedPassword = await bcrypt.hash("password123", 12);
          await db.collection("users").insertOne({
            _id: new ObjectId(),
            organizationId: testOrg._id.toString(),
            firstName: "Test",
            lastName: "User",
            email: "test@example.com",
            password: hashedPassword, // Password: password123 (properly bcrypt hashed)
            role: "admin",
            isActive: true,
            preferences: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          console.log("✅ Test user created: test@example.com / password123");
        } else if (
          existingUser.password === "hashed_password123" ||
          !existingUser.password.startsWith("$2b$")
        ) {
          // Update existing user with proper bcrypt hash
          const hashedPassword = await bcrypt.hash("password123", 12);
          await db.collection("users").updateOne(
            { email: "test@example.com" },
            {
              $set: {
                password: hashedPassword,
                updatedAt: new Date(),
              },
            }
          );
          console.log(
            "✅ Test user password updated to bcrypt hash: test@example.com / password123"
          );
        } else {
          console.log(
            "✅ Test user already exists: test@example.com / password123"
          );
        }
      } else {
        // Test user already exists, check if password needs updating
        const existingUser = await db
          .collection("users")
          .findOne({ email: "test@example.com" });
        if (
          existingUser &&
          (existingUser.password === "hashed_password123" ||
            !existingUser.password.startsWith("$2b$"))
        ) {
          // Update existing user with proper bcrypt hash
          const hashedPassword = await bcrypt.hash("password123", 12);
          await db.collection("users").updateOne(
            { email: "test@example.com" },
            {
              $set: {
                password: hashedPassword,
                updatedAt: new Date(),
              },
            }
          );
          console.log(
            "✅ Test user password updated to bcrypt hash: test@example.com / password123"
          );
        } else {
          console.log(
            "✅ Test user already exists: test@example.com / password123"
          );
        }
      }
    } catch (error) {
      console.error("⚠️ Failed to create test user:", error.message);
    }
  } else {
    console.log(
      "❌ Database connection failed - operating without persistence"
    );
  }
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});
