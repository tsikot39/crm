import { Router, Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { authService } from "../services/authService";
import { authLimiter, passwordResetLimiter } from "../middleware/rateLimiter";

const router = Router();

// Validation schemas
const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  organizationName: z
    .string()
    .min(2, "Organization name must be at least 2 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Generate JWT token
const generateToken = (user: UserDocument): string => {
  const jwtSecret = process.env.JWT_SECRET || "your-super-secret-jwt-key";

  return jwt.sign(
    {
      userId: user._id?.toString(),
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
    },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// Register new user and organization
router.post(
  "/register",
  asyncHandler(async (req: Request, res: Response) => {
    const { firstName, lastName, email, password, organizationName } =
      registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw createApiError("User with this email already exists", 409);
    }

    // Create organization slug
    const organizationSlug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if organization slug already exists
    const existingOrg = await organizationRepository.findBySlug(
      organizationSlug
    );
    if (existingOrg) {
      throw createApiError("Organization with this name already exists", 409);
    }

    // Hash password with bcrypt
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    try {
      // Create organization first
      const organization: Omit<
        OrganizationDocument,
        "_id" | "createdAt" | "updatedAt"
      > = {
        name: organizationName,
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
      };

      const newOrganization = await organizationRepository.create(organization);

      // Create user
      const userData: Omit<UserDocument, "_id" | "createdAt" | "updatedAt"> = {
        firstName,
        lastName,
        email: email.toLowerCase(),
        password: hashedPassword,
        organizationId: newOrganization._id!.toString(),
        role: "admin",
        isActive: true,
        preferences: {
          theme: "light",
          notifications: true,
          timezone: "UTC",
        },
      };

      const newUser = await userRepository.create(userData);

      // Generate JWT token
      const token = generateToken(newUser);

      logger.info("User registered successfully", {
        userId: newUser._id,
        email: newUser.email,
        organizationId: newOrganization._id,
      });

      res.status(201).json({
        success: true,
        message: "Registration successful",
        data: {
          token,
          user: {
            id: newUser._id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            role: newUser.role,
            organizationId: newUser.organizationId,
            preferences: newUser.preferences,
          },
          organization: {
            id: newOrganization._id,
            name: newOrganization.name,
            slug: newOrganization.slug,
            plan: newOrganization.plan,
            settings: newOrganization.settings,
          },
        },
      });
    } catch (error) {
      logger.error("Registration failed:", error);
      throw createApiError("Registration failed", 500);
    }
  })
);

// Login user
router.post(
  "/login",
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = loginSchema.parse(req.body);

    // Find user by email
    const user = await userRepository.findByEmail(email.toLowerCase());
    if (!user) {
      throw createApiError("Invalid credentials", 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw createApiError("Account is deactivated", 401);
    }

    // Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw createApiError("Invalid credentials", 401);
    }

    // Update last login
    await userRepository.updateLastLogin(user._id!.toString());

    // Get organization details
    const organization = await organizationRepository.findById(
      user.organizationId
    );
    if (!organization) {
      throw createApiError("Organization not found", 404);
    }

    // Generate JWT token
    const token = generateToken(user);

    logger.info("User logged in successfully", {
      userId: user._id,
      email: user.email,
    });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
          preferences: user.preferences,
          lastLoginAt: new Date(),
        },
        organization: {
          id: organization._id,
          name: organization.name,
          slug: organization.slug,
          plan: organization.plan,
          settings: organization.settings,
        },
      },
    });
  })
);

// Verify token
router.get(
  "/verify",
  asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw createApiError("Access token required", 401);
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || "your-super-secret-jwt-key";

    try {
      const decoded = jwt.verify(token, jwtSecret) as {
        userId: string;
        email: string;
        organizationId: string;
        role: string;
      };

      // Fetch current user data
      const user = await userRepository.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw createApiError("Invalid token", 401);
      }

      const organization = await organizationRepository.findById(
        user.organizationId
      );
      if (!organization) {
        throw createApiError("Organization not found", 404);
      }

      res.json({
        success: true,
        message: "Token is valid",
        data: {
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId,
            preferences: user.preferences,
          },
          organization: {
            id: organization._id,
            name: organization.name,
            slug: organization.slug,
            plan: organization.plan,
            settings: organization.settings,
          },
        },
      });
    } catch (error) {
      throw createApiError("Invalid or expired token", 401);
    }
  })
);

// Logout (client-side token removal)
router.post("/logout", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Logout successful",
  });
});

export { router as authRouter };
