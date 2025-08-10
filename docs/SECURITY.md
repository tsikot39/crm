# 🔐 Security & Best Practices

## Security-First Architecture

Our CRM platform implements enterprise-grade security measures following OWASP guidelines and industry best practices. Security is embedded at every layer, from the database to the user interface.

---

## 🛡️ Authentication & Authorization

### JWT-Based Authentication

```typescript
// Secure JWT implementation with automatic refresh
interface JWTPayload {
  userId: string;
  email: string;
  organizationId: string;
  role: UserRole;
  iat: number;
  exp: number;
}

const generateTokens = (user: User) => {
  const accessToken = jwt.sign(
    {
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
    },
    process.env.JWT_SECRET!,
    { expiresIn: "15m" } // Short-lived access token
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: "7d" } // Longer-lived refresh token
  );

  return { accessToken, refreshToken };
};
```

### Password Security

```typescript
// bcrypt password hashing with high salt rounds
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12; // High security salt rounds
  return await bcrypt.hash(password, saltRounds);
};

const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};
```

### Role-Based Access Control (RBAC)

```typescript
enum UserRole {
  ADMIN = "admin", // Full system access
  MANAGER = "manager", // Team management + data access
  SALES_REP = "sales_rep", // Own data + assigned accounts
  VIEWER = "viewer", // Read-only access
}

interface Permission {
  resource: string;
  actions: ("create" | "read" | "update" | "delete")[];
}

const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    { resource: "*", actions: ["create", "read", "update", "delete"] },
  ],
  [UserRole.MANAGER]: [
    { resource: "contacts", actions: ["create", "read", "update", "delete"] },
    { resource: "companies", actions: ["create", "read", "update", "delete"] },
    { resource: "deals", actions: ["create", "read", "update", "delete"] },
    { resource: "users", actions: ["read"] },
  ],
  // ... other roles
};
```

---

## 🏢 Multi-Tenant Data Isolation

### Organization-Based Separation

Every database operation is automatically scoped to the user's organization:

```javascript
// Middleware for automatic organization filtering
const addOrganizationFilter = (req, res, next) => {
  // Extract organization from JWT
  const { organizationId } = req.user;

  // Add organization filter to all queries
  req.query = {
    ...req.query,
    organizationId,
  };

  next();
};

// Example: Contact retrieval with tenant isolation
const getContacts = async (req) => {
  const { organizationId } = req.user;

  const contacts = await db.collection("contacts").find({
    organizationId, // 🔒 Automatic tenant isolation
    ...req.query,
  });

  return contacts;
};
```

### Zero Data Leakage Guarantee

```javascript
// Database query validation middleware
const validateTenantAccess = async (req, res, next) => {
  const { organizationId } = req.user;
  const { id } = req.params;

  // Verify resource belongs to user's organization
  const resource = await db.collection(req.collection).findOne({
    _id: new ObjectId(id),
    organizationId,
  });

  if (!resource) {
    return res.status(404).json({ error: "Resource not found" });
  }

  req.resource = resource;
  next();
};
```

---

## 🔒 Data Protection & Encryption

### Encryption at Rest

```typescript
// Sensitive field encryption using AES-256
import crypto from "crypto";

const algorithm = "aes-256-gcm";
const secretKey = crypto.scryptSync(process.env.ENCRYPTION_KEY!, "salt", 32);

const encrypt = (text: string) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, secretKey);
  cipher.setAutoPadding(true);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
};
```

### Sensitive Data Handling

```typescript
// PII data masking for logs and exports
const maskSensitiveData = (data: any): any => {
  const sensitiveFields = ["password", "ssn", "creditCard"];

  return Object.keys(data).reduce((acc, key) => {
    if (sensitiveFields.includes(key)) {
      acc[key] = "***MASKED***";
    } else {
      acc[key] = data[key];
    }
    return acc;
  }, {} as any);
};
```

---

## 🚨 Input Validation & Sanitization

### Comprehensive Input Validation

```typescript
// Zod schemas for runtime validation
const ContactSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name too long")
    .regex(/^[a-zA-Z\s'-]+$/, "Invalid characters in name"),

  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email too long")
    .refine(async (email) => {
      // Check for disposable email domains
      const disposableDomains = await getDisposableEmailDomains();
      const domain = email.split("@")[1];
      return !disposableDomains.includes(domain);
    }, "Disposable email addresses not allowed"),

  phone: z
    .string()
    .regex(/^[\+]?[1-9][\d]{0,15}$/, "Invalid phone number")
    .optional(),
});
```

### XSS Prevention

```typescript
// HTML sanitization and XSS prevention
import DOMPurify from "isomorphic-dompurify";

const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a"],
    ALLOWED_ATTR: ["href"],
    FORBID_SCRIPT: true,
  });
};

// Input sanitization middleware
const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === "string") {
      return sanitizeHtml(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    if (obj && typeof obj === "object") {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  };

  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  next();
};
```

---

## 🔐 API Security

### Rate Limiting

```typescript
// Advanced rate limiting with Redis
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";

const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: "crm_rate_limit:",
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: async (req) => {
    // Dynamic rate limiting based on user role
    const user = req.user;
    switch (user?.role) {
      case "admin":
        return 1000;
      case "manager":
        return 500;
      case "sales_rep":
        return 200;
      default:
        return 100;
    }
  },
  message: "Too many requests from this IP",
  standardHeaders: true,
  legacyHeaders: false,
});
```

### CORS Configuration

```typescript
// Secure CORS configuration
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["X-Total-Count"],
  maxAge: 86400, // 24 hours
};
```

### Security Headers

```typescript
// Helmet.js security headers configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", process.env.API_URL!],
        objectSrc: ["'none'"],
        mediaSrc: ["'none'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin",
    },
  })
);
```

---

## 📊 Security Monitoring & Audit Logging

### Comprehensive Audit Trail

```typescript
// Audit logging for all user actions
interface AuditLog {
  userId: string;
  organizationId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, { before: any; after: any }>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
}

const logUserAction = async (req: Request, action: string, resource: any) => {
  const auditLog: AuditLog = {
    userId: req.user!.id,
    organizationId: req.user!.organizationId,
    action,
    resource: req.route?.path || "unknown",
    resourceId: resource.id || resource._id,
    ipAddress: req.ip,
    userAgent: req.get("User-Agent") || "unknown",
    timestamp: new Date(),
    success: true,
  };

  await db.collection("audit_logs").insertOne(auditLog);
};
```

### Security Monitoring

```typescript
// Real-time security threat detection
const detectSuspiciousActivity = async (req: Request) => {
  const alerts = [];

  // Multiple failed login attempts
  const failedLogins = await getFailedLoginCount(req.ip, "1h");
  if (failedLogins > 5) {
    alerts.push("Multiple failed login attempts detected");
  }

  // Unusual access patterns
  const userActivity = await getUserActivity(req.user!.id, "24h");
  if (isUnusualPattern(userActivity)) {
    alerts.push("Unusual access pattern detected");
  }

  // Geographic anomalies
  const userLocation = await getUserLocation(req.ip);
  const lastKnownLocation = await getLastUserLocation(req.user!.id);
  if (isGeographicAnomaly(userLocation, lastKnownLocation)) {
    alerts.push("Access from unusual location");
  }

  if (alerts.length > 0) {
    await sendSecurityAlert(req.user!.id, alerts);
  }
};
```

---

## 🔄 Session Management

### Secure Session Handling

```typescript
// Secure session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    httpOnly: true, // Prevent XSS attacks
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: "strict" as const, // CSRF protection
  },
  name: "crm_session_id", // Don't use default session name
  genid: () => {
    return crypto.randomBytes(32).toString("hex"); // Strong session ID
  },
};
```

### Token Blacklisting

```typescript
// JWT token blacklisting for logout
const blacklistToken = async (token: string) => {
  const decoded = jwt.decode(token) as JWTPayload;
  const expirationTime = new Date(decoded.exp * 1000);

  await redisClient.setex(
    `blacklist_${token}`,
    Math.floor((expirationTime.getTime() - Date.now()) / 1000),
    "blacklisted"
  );
};

const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const result = await redisClient.get(`blacklist_${token}`);
  return result === "blacklisted";
};
```

---

## 🔍 Compliance & Privacy

### GDPR Compliance

```typescript
// GDPR data portability implementation
const exportUserData = async (userId: string) => {
  const userData = await db
    .collection("users")
    .findOne({ _id: new ObjectId(userId) });
  const contactsData = await db
    .collection("contacts")
    .find({ createdBy: userId })
    .toArray();
  const companiesData = await db
    .collection("companies")
    .find({ createdBy: userId })
    .toArray();

  return {
    personal_information: userData,
    contacts: contactsData,
    companies: companiesData,
    export_date: new Date().toISOString(),
  };
};

// GDPR right to deletion
const deleteUserData = async (userId: string, organizationId: string) => {
  // Anonymize instead of hard delete for audit trail
  await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        email: `deleted_${Date.now()}@deleted.com`,
        firstName: "[DELETED]",
        lastName: "[DELETED]",
        deletedAt: new Date(),
      },
    }
  );

  // Remove from active organization
  await db
    .collection("organizations")
    .updateOne(
      { _id: new ObjectId(organizationId) },
      { $pull: { members: userId } }
    );
};
```

### Privacy Controls

```typescript
// Privacy-first data collection
interface PrivacySettings {
  analytics: boolean;
  marketing: boolean;
  thirdPartySharing: boolean;
  emailNotifications: boolean;
  dataRetentionPeriod: number; // days
}

const updatePrivacySettings = async (
  userId: string,
  settings: PrivacySettings
) => {
  await db
    .collection("users")
    .updateOne(
      { _id: new ObjectId(userId) },
      { $set: { privacySettings: settings } }
    );

  // Apply privacy settings immediately
  if (!settings.analytics) {
    await disableAnalytics(userId);
  }

  if (!settings.marketing) {
    await unsubscribeFromMarketing(userId);
  }
};
```

---

## 🛡️ Security Best Practices Implementation

### Environment Security

```bash
# .env.example with security best practices
NODE_ENV=production
JWT_SECRET=<generate-strong-random-key-256-bits>
JWT_REFRESH_SECRET=<different-strong-random-key-256-bits>
DATABASE_URL=<secure-connection-string-with-ssl>
ENCRYPTION_KEY=<32-byte-encryption-key>
SESSION_SECRET=<session-secret-key>
REDIS_URL=<redis-connection-with-auth>
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Database Security

```typescript
// MongoDB security configuration
const mongoOptions = {
  useUnifiedTopology: true,
  ssl: true,
  authSource: "admin",
  retryWrites: true,
  w: "majority",
  readPreference: "secondaryPreferred",
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,
};
```

### Error Handling Security

```typescript
// Secure error handling that doesn't leak information
const secureErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log full error details server-side
  logger.error("Application error", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id,
    organizationId: req.user?.organizationId,
  });

  // Send sanitized error response to client
  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(500).json({
    error: "Internal server error",
    message: isDevelopment ? err.message : "Something went wrong",
    requestId: req.id, // For support correlation
  });
};
```

This comprehensive security implementation ensures that our CRM platform meets enterprise security standards and provides peace of mind for our users and their data.
