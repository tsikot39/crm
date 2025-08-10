import { describe, it, expect } from "vitest";

// Simple utility tests
describe("Utility Functions", () => {
  describe("Email Validation", () => {
    const validateEmail = (email: string): boolean => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    it("should validate correct email formats", () => {
      expect(validateEmail("test@example.com")).toBe(true);
      expect(validateEmail("user+tag@domain.co.uk")).toBe(true);
      expect(validateEmail("user.name@subdomain.domain.com")).toBe(true);
    });

    it("should reject invalid email formats", () => {
      expect(validateEmail("invalid-email")).toBe(false);
      expect(validateEmail("@example.com")).toBe(false);
      expect(validateEmail("test@")).toBe(false);
      expect(validateEmail("")).toBe(false);
    });
  });

  describe("Password Validation", () => {
    const validatePassword = (
      password: string
    ): { valid: boolean; message?: string } => {
      if (!password) return { valid: false, message: "Password is required" };
      if (password.length < 6)
        return {
          valid: false,
          message: "Password must be at least 6 characters",
        };
      return { valid: true };
    };

    it("should validate correct passwords", () => {
      expect(validatePassword("password123").valid).toBe(true);
      expect(validatePassword("mySecurePassword").valid).toBe(true);
    });

    it("should reject invalid passwords", () => {
      const result1 = validatePassword("");
      expect(result1.valid).toBe(false);
      expect(result1.message).toBe("Password is required");

      const result2 = validatePassword("123");
      expect(result2.valid).toBe(false);
      expect(result2.message).toBe("Password must be at least 6 characters");
    });
  });

  describe("Form Utils", () => {
    const formatPhoneNumber = (phone: string): string => {
      // Remove all non-digit characters
      const cleaned = phone.replace(/\D/g, "");

      // Format as (XXX) XXX-XXXX if 10 digits
      if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
          6
        )}`;
      }

      return phone; // Return original if not 10 digits
    };

    it("should format phone numbers correctly", () => {
      expect(formatPhoneNumber("1234567890")).toBe("(123) 456-7890");
      expect(formatPhoneNumber("123-456-7890")).toBe("(123) 456-7890");
      expect(formatPhoneNumber("(123) 456-7890")).toBe("(123) 456-7890");
    });

    it("should leave invalid phone numbers unchanged", () => {
      expect(formatPhoneNumber("123")).toBe("123");
      expect(formatPhoneNumber("abc")).toBe("abc");
    });
  });
});
