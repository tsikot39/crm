import { Router, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { asyncHandler, createApiError } from "../middleware/errorHandler";

const router = Router();

// Get all deals for organization
router.get(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createApiError("Authentication required", 401);
    }

    // Mock deals data for testing
    const mockDeals = [
      {
        _id: "deal1",
        title: "Enterprise Software License",
        company: "TechCorp Inc",
        contactName: "John Smith",
        companyId: { name: "TechCorp Inc" },
        contactId: { firstName: "John", lastName: "Smith" },
        value: 50000,
        probability: 80,
        stage: "negotiation",
        expectedCloseDate: "2025-09-15",
        lastActivity: "2025-08-01",
        createdAt: "2025-07-15",
        updatedAt: "2025-08-01",
      },
      {
        _id: "deal2",
        title: "Cloud Infrastructure Migration",
        company: "StartupXYZ",
        contactName: "Sarah Johnson",
        companyId: { name: "StartupXYZ" },
        contactId: { firstName: "Sarah", lastName: "Johnson" },
        value: 25000,
        probability: 60,
        stage: "proposal",
        expectedCloseDate: "2025-08-30",
        lastActivity: "2025-07-28",
        createdAt: "2025-07-10",
        updatedAt: "2025-07-28",
      },
      {
        _id: "deal3",
        title: "Mobile App Development",
        company: "RetailCo",
        contactName: "Mike Wilson",
        companyId: { name: "RetailCo" },
        contactId: { firstName: "Mike", lastName: "Wilson" },
        value: 75000,
        probability: 90,
        stage: "closed-won",
        expectedCloseDate: "2025-08-15",
        lastActivity: "2025-07-30",
        createdAt: "2025-06-20",
        updatedAt: "2025-07-30",
      },
    ];

    res.json({
      success: true,
      data: {
        deals: mockDeals,
        pagination: {
          page: 1,
          limit: 50,
          total: mockDeals.length,
          pages: 1,
        },
      },
    });
  })
);

// Create new deal
router.post(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createApiError("Authentication required", 401);
    }

    res.status(201).json({
      success: true,
      message: "Deal creation - Coming soon",
    });
  })
);

// Update existing deal
router.put(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createApiError("Authentication required", 401);
    }

    const { id } = req.params;
    
    res.json({
      success: true,
      message: `Deal ${id} update - Coming soon`,
      data: req.body,
    });
  })
);

// Delete deal
router.delete(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createApiError("Authentication required", 401);
    }

    const { id } = req.params;
    
    res.json({
      success: true,
      message: `Deal ${id} deletion - Coming soon`,
    });
  })
);

// Get single deal
router.get(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createApiError("Authentication required", 401);
    }

    const { id } = req.params;
    
    res.json({
      success: true,
      message: `Get deal ${id} - Coming soon`,
    });
  })
);

export { router as dealsRouter };
