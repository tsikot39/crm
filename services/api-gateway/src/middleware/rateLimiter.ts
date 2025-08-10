import rateLimit from "express-rate-limit";
import { Request } from "express";

/**
 * Standard rate limiter for general API endpoints
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 authentication attempts per windowMs
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Password reset rate limiter
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset attempts per hour
  message: {
    error: "Too many password reset attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Create operation rate limiter (for POST endpoints)
 */
export const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 create operations per minute
  message: {
    error: "Too many create operations, please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Search operation rate limiter
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 search operations per minute
  message: {
    error: "Too many search requests, please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Custom rate limiter that can be configured per user role
 */
export const createUserBasedLimiter = (
  maxRequests: number,
  windowMs: number
) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, otherwise fall back to IP
      const user = (req as Request & { user?: { id: string } }).user;
      return user?.id || req.ip || "unknown";
    },
    message: {
      error: "Rate limit exceeded for your account.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};
