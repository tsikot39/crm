import { Router, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { asyncHandler, createApiError } from "../middleware/errorHandler";

const router = Router();

// Get all activities for organization
router.get(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createApiError("Authentication required", 401);
    }

    res.json({
      success: true,
      data: {
        activities: [],
        message: "Activities endpoint - Coming soon",
      },
    });
  })
);

// Create new activity
router.post(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createApiError("Authentication required", 401);
    }

    res.status(201).json({
      success: true,
      message: "Activity creation - Coming soon",
    });
  })
);

export { router as activitiesRouter };
