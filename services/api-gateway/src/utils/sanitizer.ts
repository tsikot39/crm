/**
 * Input sanitization utilities
 * Protects against injection attacks and ensures data integrity
 */

/**
 * Escapes regex special characters to prevent ReDoS attacks
 */
export const escapeRegex = (input: string): string => {
  if (typeof input !== "string") return "";
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/**
 * Sanitizes search queries to prevent injection
 */
export const sanitizeSearchQuery = (query: string): string => {
  if (!query || typeof query !== "string") return "";

  // Remove dangerous patterns and escape regex special chars
  const sanitized = query
    .trim()
    .slice(0, 100) // Limit length
    .replace(/[<>'";&\\]/g, "") // Remove potentially dangerous characters
    .replace(/\s+/g, " "); // Normalize whitespace

  return escapeRegex(sanitized);
};

/**
 * Validates and sanitizes email addresses
 */
export const sanitizeEmail = (email: string): string => {
  if (!email || typeof email !== "string") return "";

  return email.toLowerCase().trim().slice(0, 254); // RFC 5321 limit
};

/**
 * Sanitizes general text inputs
 */
export const sanitizeText = (
  input: string,
  maxLength: number = 255
): string => {
  if (!input || typeof input !== "string") return "";

  return input.trim().slice(0, maxLength).replace(/[<>]/g, ""); // Basic XSS prevention
};

/**
 * Validates MongoDB ObjectId format
 */
export const isValidObjectId = (id: string): boolean => {
  if (!id || typeof id !== "string") return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Sanitizes numeric inputs
 */
export const sanitizeNumber = (
  input: unknown,
  defaultValue: number = 0
): number => {
  const num = Number(input);
  return isNaN(num) ? defaultValue : Math.max(0, num);
};
