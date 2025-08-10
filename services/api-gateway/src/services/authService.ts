import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import {
  userRepository,
  organizationRepository,
} from "../../../../shared/database/repositories";
import {
  UserDocument,
  OrganizationDocument,
} from "../../../../shared/database/types";
import { createApiError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { sanitizeEmail, sanitizeText } from "../utils/sanitizer";

// Type definitions
interface UserPreferences {
  theme: string;
  notifications: boolean;
  timezone: string;
}

interface OrganizationSettings {
  currency: string;
  timezone: string;
  dateFormat: string;
  features: string[];
}

interface AuthResponse {
  token: string;
  user: {
    id: unknown;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    organizationId: string;
    preferences: UserPreferences;
    lastLoginAt?: Date;
  };
  organization: {
    id: unknown;
    name: string;
    slug: string;
    plan: string;
    settings: OrganizationSettings;
  };
}

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

export class AuthService {
  /**
   * Generate JWT token for authenticated user
   */
  private generateToken(user: UserDocument): string {
    const jwtSecret = process.env.JWT_SECRET || "your-super-secret-jwt-key";

    return jwt.sign(
      {
        userId: user._id?.toString(),
        email: user.email,
        organizationId: user.organizationId,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" } as jwt.SignOptions
    );
  }

  /**
   * Create organization slug from name
   */
  private createOrganizationSlug(organizationName: string): string {
    return sanitizeText(organizationName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  /**
   * Register a new user and organization
   */
  async register(data: unknown): Promise<AuthResponse> {
    const validatedData = registerSchema.parse(data);
    const { firstName, lastName, email, password, organizationName } =
      validatedData;

    // Sanitize inputs
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedFirstName = sanitizeText(firstName, 50);
    const sanitizedLastName = sanitizeText(lastName, 50);
    const sanitizedOrgName = sanitizeText(organizationName, 100);

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(sanitizedEmail);
    if (existingUser) {
      throw createApiError("User with this email already exists", 409);
    }

    // Create organization slug
    const organizationSlug = this.createOrganizationSlug(sanitizedOrgName);

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
      };

      const newOrganization = await organizationRepository.create(organization);

      // Create user
      const userData: Omit<UserDocument, "_id" | "createdAt" | "updatedAt"> = {
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
        email: sanitizedEmail,
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
      const token = this.generateToken(newUser);

      logger.info("User registered successfully", {
        userId: newUser._id,
        email: newUser.email,
        organizationId: newOrganization._id,
      });

      return {
        token,
        user: {
          id: newUser._id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          role: newUser.role,
          organizationId: newUser.organizationId,
          preferences: newUser.preferences || {
            theme: "light",
            notifications: true,
            timezone: "UTC",
          },
        },
        organization: {
          id: newOrganization._id,
          name: newOrganization.name,
          slug: newOrganization.slug,
          plan: newOrganization.plan,
          settings: newOrganization.settings,
        },
      };
    } catch (error) {
      logger.error("Registration failed:", error);
      throw createApiError("Registration failed", 500);
    }
  }

  /**
   * Login user with email and password
   */
  async login(data: unknown): Promise<AuthResponse> {
    const validatedData = loginSchema.parse(data);
    const { email, password } = validatedData;

    // Sanitize email input
    const sanitizedEmail = sanitizeEmail(email);

    // Find user by email
    const user = await userRepository.findByEmail(sanitizedEmail);
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
    const token = this.generateToken(user);

    logger.info("User logged in successfully", {
      userId: user._id,
      email: user.email,
    });

    return {
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        preferences: user.preferences || {
          theme: "light",
          notifications: true,
          timezone: "UTC",
        },
        lastLoginAt: new Date(),
      },
      organization: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
        plan: organization.plan,
        settings: organization.settings,
      },
    };
  }

  /**
   * Verify JWT token and return user data
   */
  async verifyToken(token: string): Promise<Omit<AuthResponse, "token">> {
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
      if (!user?.isActive) {
        throw createApiError("Invalid token", 401);
      }

      const organization = await organizationRepository.findById(
        user.organizationId
      );
      if (!organization) {
        throw createApiError("Organization not found", 404);
      }

      return {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
          preferences: user.preferences || {
            theme: "light",
            notifications: true,
            timezone: "UTC",
          },
        },
        organization: {
          id: organization._id,
          name: organization.name,
          slug: organization.slug,
          plan: organization.plan,
          settings: organization.settings,
        },
      };
    } catch (err) {
      logger.error("Token verification failed:", err);
      throw createApiError("Invalid or expired token", 401);
    }
  }
}

export const authService = new AuthService();
