import { Router, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { asyncHandler, createApiError } from "../middleware/errorHandler";

const router = Router();

// Get current user profile
router.get(
  "/profile",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createApiError("Authentication required", 401);
    }

    res.json({
      success: true,
      data: {
        user: req.user,
        message: "User profile endpoint - Coming soon",
      },
    });
  })
);

// Update user profile
router.put(
  "/profile",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createApiError("Authentication required", 401);
    }

    res.json({
      success: true,
      message: "User profile update - Coming soon",
    });
  })
);

export { router as usersRouter };
