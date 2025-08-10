import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error
  logger.error("API Error:", {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    statusCode: error.statusCode,
  });

  // Default error values
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error";

  // Handle specific error types
  if (error.name === "ValidationError") {
    statusCode = 400;
    message = "Validation error";
  }

  if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  }

  if (error.name === "MongoServerError") {
    statusCode = 500;
    message = "Database error";
  }

  if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && {
      error: error.message,
      stack: error.stack,
    }),
  });
};

// Create API error
export const createApiError = (
  message: string,
  statusCode: number = 500
): ApiError => {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

// Async error wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
