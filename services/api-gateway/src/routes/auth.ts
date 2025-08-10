import { Router, Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { authService } from "../services/authService";
import { authLimiter } from "../middleware/rateLimiter";

const router = Router();

// Register new user and organization
router.post(
  "/register",
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: result,
    });
  })
);

// Login user
router.post(
  "/login",
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);

    res.json({
      success: true,
      message: "Login successful",
      data: result,
    });
  })
);

// Verify token
router.get(
  "/verify",
  asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const token = authHeader.substring(7);
    const result = await authService.verifyToken(token);

    res.json({
      success: true,
      message: "Token is valid",
      data: result,
    });
  })
);

export { router as authRouter };
