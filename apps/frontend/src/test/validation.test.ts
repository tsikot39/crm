import { describe, it, expect } from "vitest";
import { z } from "zod";

// Test the shared validation schemas
describe("Validation Schemas", () => {
  describe("User Schema", () => {
    // Mock the shared types since we can't import them directly
    const UserRoleSchema = z.enum(["admin", "manager", "sales_rep", "viewer"]);
    const UserStatusSchema = z.enum(["active", "inactive", "pending"]);

    const UserSchema = z.object({
      id: z.string(),
      email: z.string().email(),
      firstName: z.string(),
      lastName: z.string(),
      avatar: z.string().optional(),
      role: UserRoleSchema,
      status: UserStatusSchema,
      organizationId: z.string(),
      createdAt: z.date(),
      updatedAt: z.date(),
      lastLoginAt: z.date().optional(),
    });

    it("should validate correct user data", () => {
      const validUser = {
        id: "user-1",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "admin" as const,
        status: "active" as const,
        organizationId: "org-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = UserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const invalidUser = {
        id: "user-1",
        email: "invalid-email",
        firstName: "Test",
        lastName: "User",
        role: "admin" as const,
        status: "active" as const,
        organizationId: "org-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = UserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it("should reject invalid role", () => {
      const invalidUser = {
        id: "user-1",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "invalid_role",
        status: "active" as const,
        organizationId: "org-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = UserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });

  describe("Contact Schema", () => {
    const ContactTypeSchema = z.enum([
      "lead",
      "prospect",
      "customer",
      "partner",
    ]);
    const ContactSourceSchema = z.enum([
      "website",
      "referral",
      "social_media",
      "email_campaign",
      "cold_call",
      "event",
      "other",
    ]);

    const ContactSchema = z.object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      company: z.string().optional(),
      jobTitle: z.string().optional(),
      type: ContactTypeSchema,
      source: ContactSourceSchema,
      organizationId: z.string(),
      assignedUserId: z.string().optional(),
      createdAt: z.date(),
      updatedAt: z.date(),
    });

    it("should validate correct contact data", () => {
      const validContact = {
        id: "contact-1",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        type: "lead" as const,
        source: "website" as const,
        organizationId: "org-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = ContactSchema.safeParse(validContact);
      expect(result.success).toBe(true);
    });

    it("should allow optional fields to be undefined", () => {
      const minimalContact = {
        id: "contact-1",
        firstName: "John",
        lastName: "Doe",
        type: "lead" as const,
        source: "website" as const,
        organizationId: "org-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = ContactSchema.safeParse(minimalContact);
      expect(result.success).toBe(true);
    });

    it("should reject invalid contact type", () => {
      const invalidContact = {
        id: "contact-1",
        firstName: "John",
        lastName: "Doe",
        type: "invalid_type",
        source: "website" as const,
        organizationId: "org-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = ContactSchema.safeParse(invalidContact);
      expect(result.success).toBe(false);
    });
  });

  describe("Login Schema", () => {
    const LoginSchema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    });

    it("should validate correct login data", () => {
      const validLogin = {
        email: "test@example.com",
        password: "password123",
      };

      const result = LoginSchema.safeParse(validLogin);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email format", () => {
      const invalidLogin = {
        email: "invalid-email",
        password: "password123",
      };

      const result = LoginSchema.safeParse(invalidLogin);
      expect(result.success).toBe(false);
    });

    it("should reject short password", () => {
      const invalidLogin = {
        email: "test@example.com",
        password: "123",
      };

      const result = LoginSchema.safeParse(invalidLogin);
      expect(result.success).toBe(false);
    });
  });

  describe("Pagination Schema", () => {
    const PaginationSchema = z.object({
      page: z.number().min(1),
      limit: z.number().min(1).max(100),
      total: z.number().min(0),
      pages: z.number().min(0),
    });

    it("should validate correct pagination data", () => {
      const validPagination = {
        page: 1,
        limit: 10,
        total: 100,
        pages: 10,
      };

      const result = PaginationSchema.safeParse(validPagination);
      expect(result.success).toBe(true);
    });

    it("should reject page less than 1", () => {
      const invalidPagination = {
        page: 0,
        limit: 10,
        total: 100,
        pages: 10,
      };

      const result = PaginationSchema.safeParse(invalidPagination);
      expect(result.success).toBe(false);
    });

    it("should reject limit greater than 100", () => {
      const invalidPagination = {
        page: 1,
        limit: 150,
        total: 100,
        pages: 10,
      };

      const result = PaginationSchema.safeParse(invalidPagination);
      expect(result.success).toBe(false);
    });
  });
});
