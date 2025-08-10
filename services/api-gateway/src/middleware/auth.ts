import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { userRepository } from "../../../../shared/database/repositories";
import { logger } from "../utils/logger";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
    role: string;
    email: string;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Access token required",
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access token required",
      });
      return;
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET || "your-super-secret-jwt-key";

    try {
      const decoded = jwt.verify(token, jwtSecret) as {
        userId: string;
        email: string;
        organizationId: string;
        role: string;
        iat: number;
        exp: number;
      };

      // Fetch user from database to ensure they still exist and are active
      const user = await userRepository.findById(decoded.userId);

      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          message: "Invalid token - user not found or inactive",
        });
        return;
      }

      // Attach user info to request object
      req.user = {
        id: user._id!.toString(),
        organizationId: user.organizationId,
        role: user.role,
        email: user.email,
      };

      next();
    } catch (jwtError) {
      logger.error("JWT verification failed:", jwtError);
      res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
      return;
    }
  } catch (error) {
    logger.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during authentication",
    });
  }
};

// Role-based authorization middleware
export const requireRole = (roles: string[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
      return;
    }

    next();
  };
};

// Organization access middleware
export const requireOrganizationAccess = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const organizationId = req.params.organizationId || req.body.organizationId;

  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  if (organizationId && req.user.organizationId !== organizationId) {
    res.status(403).json({
      success: false,
      message: "Access denied to this organization",
    });
    return;
  }

  next();
};

export type { AuthenticatedRequest };
