import { Router, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { asyncHandler, createApiError } from "../middleware/errorHandler";
import { z } from "zod";
import { MongoClient, ObjectId } from "mongodb";

const router = Router();

// MongoDB configuration
const MONGODB_URI =
  "mongodb+srv://tsikot39:n4w5rb@cluster0.3f8yqnc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const DATABASE_NAME = "crm_saas_platform";

let db: any = null;

// Connect to MongoDB
async function getDatabase() {
  if (!db) {
    try {
      const client = new MongoClient(MONGODB_URI);
      await client.connect();
      db = client.db(DATABASE_NAME);
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw new Error("Database connection failed");
    }
  }
  return db;
}

// Validation schemas
const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  industry: z.string().optional(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      zipCode: z.string().optional(),
    })
    .optional(),
  size: z
    .enum(["startup", "small", "medium", "large", "enterprise"])
    .optional(),
  description: z.string().optional(),
});

const updateCompanySchema = createCompanySchema.partial();

// Get all companies for organization
router.get(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createApiError("Authentication required", 401);
    }

    const { page = 1, limit = 20, search } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 20);
    const skip = (pageNum - 1) * limitNum;

    try {
      const database = await getDatabase();

      // Build search filter
      const searchFilter: any = {
        organizationId: new ObjectId(req.user.organizationId),
      };

      if (search) {
        const searchTerm = search as string;
        searchFilter.$or = [
          { name: { $regex: searchTerm, $options: "i" } },
          { industry: { $regex: searchTerm, $options: "i" } },
          { website: { $regex: searchTerm, $options: "i" } },
        ];
      }

      // Get companies from database
      const companies = await database
        .collection("companies")
        .find(searchFilter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum)
        .toArray();

      const totalCompanies = await database
        .collection("companies")
        .countDocuments(searchFilter);

      const totalPages = Math.ceil(totalCompanies / limitNum);

      // Transform companies for frontend
      const transformedCompanies = companies.map((company: any) => ({
        id: company._id.toString(),
        name: company.name,
        industry: company.industry,
        website: company.website,
        size: company.size,
        revenue: company.revenue || 0,
        location: company.location,
        primaryContact: company.primaryContact,
        contactCount: company.contactCount || 0,
        dealCount: company.dealCount || 0,
        lastActivity: company.lastActivity,
        status: company.status,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      }));

      res.json({
        success: true,
        data: {
          companies: transformedCompanies,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: totalCompanies,
            pages: totalPages,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching companies:", error);
      throw createApiError("Failed to fetch companies", 500);
    }
  })
);

// Search companies endpoint
router.get(
  "/search",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createApiError("Authentication required", 401);
    }

    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.json({
        success: true,
        data: { companies: [] },
      });
    }

    try {
      const database = await getDatabase();
      const limitNum = parseInt(limit as string, 10);

      // Build search filter
      const searchFilter: any = {
        organizationId: new ObjectId(req.user.organizationId),
      };
      const searchTerm = q as string;

      searchFilter.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { industry: { $regex: searchTerm, $options: "i" } },
        { website: { $regex: searchTerm, $options: "i" } },
      ];

      // Get companies from database
      const companies = await database
        .collection("companies")
        .find(searchFilter)
        .sort({ name: 1 })
        .limit(limitNum)
        .toArray();

      // Transform companies for search results
      const transformedCompanies = companies.map((company: any) => ({
        _id: company._id.toString(),
        name: company.name,
        industry: company.industry,
        website: company.website,
        description: company.description || `${company.industry} company`,
      }));

      res.json({
        success: true,
        data: { companies: transformedCompanies },
      });
    } catch (error) {
      console.error("Error searching companies:", error);
      throw createApiError("Failed to search companies", 500);
    }
  })
);

// Get company by ID
router.get(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createApiError("Authentication required", 401);
    }

    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      throw createApiError("Invalid company ID", 400);
    }

    try {
      const database = await getDatabase();

      const company = await database.collection("companies").findOne({
        _id: new ObjectId(id),
        organizationId: new ObjectId(req.user.organizationId),
      });

      if (!company) {
        throw createApiError("Company not found", 404);
      }

      const transformedCompany = {
        id: company._id.toString(),
        name: company.name,
        industry: company.industry,
        website: company.website,
        size: company.size,
        revenue: company.revenue || 0,
        location: company.location,
        primaryContact: company.primaryContact,
        contactCount: company.contactCount || 0,
        dealCount: company.dealCount || 0,
        lastActivity: company.lastActivity,
        status: company.status,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      };

      res.json({
        success: true,
        data: { company: transformedCompany },
      });
    } catch (error) {
      console.error("Error fetching company:", error);
      throw createApiError("Failed to fetch company", 500);
    }
  })
);

// Create new company
router.post(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createApiError("Authentication required", 401);
    }

    try {
      const validatedData = createCompanySchema.parse(req.body);
      const database = await getDatabase();

      const newCompany = {
        ...validatedData,
        organizationId: new ObjectId(req.user.organizationId),
        contactCount: 0,
        dealCount: 0,
        revenue: 0,
        lastActivity: new Date().toISOString().split("T")[0],
        status: "prospect",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await database
        .collection("companies")
        .insertOne(newCompany);

      const company = await database
        .collection("companies")
        .findOne({ _id: result.insertedId });

      const transformedCompany = {
        id: company._id.toString(),
        name: company.name,
        industry: company.industry,
        website: company.website,
        size: company.size,
        revenue: company.revenue || 0,
        location: company.location,
        primaryContact: company.primaryContact,
        contactCount: company.contactCount || 0,
        dealCount: company.dealCount || 0,
        lastActivity: company.lastActivity,
        status: company.status,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      };

      res.status(201).json({
        success: true,
        data: { company: transformedCompany },
        message: "Company created successfully",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw createApiError(
          `Validation error: ${error.errors.map((e) => e.message).join(", ")}`,
          400
        );
      }
      console.error("Error creating company:", error);
      throw createApiError("Failed to create company", 500);
    }
  })
);

// Update company
router.put(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createApiError("Authentication required", 401);
    }

    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      throw createApiError("Invalid company ID", 400);
    }

    try {
      const validatedData = updateCompanySchema.parse(req.body);
      const database = await getDatabase();

      const updateData = {
        ...validatedData,
        updatedAt: new Date(),
      };

      const result = await database.collection("companies").updateOne(
        {
          _id: new ObjectId(id),
          organizationId: new ObjectId(req.user.organizationId),
        },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        throw createApiError("Company not found", 404);
      }

      const company = await database
        .collection("companies")
        .findOne({ _id: new ObjectId(id) });

      const transformedCompany = {
        id: company._id.toString(),
        name: company.name,
        industry: company.industry,
        website: company.website,
        size: company.size,
        revenue: company.revenue || 0,
        location: company.location,
        primaryContact: company.primaryContact,
        contactCount: company.contactCount || 0,
        dealCount: company.dealCount || 0,
        lastActivity: company.lastActivity,
        status: company.status,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      };

      res.json({
        success: true,
        data: { company: transformedCompany },
        message: "Company updated successfully",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw createApiError(
          `Validation error: ${error.errors.map((e) => e.message).join(", ")}`,
          400
        );
      }
      console.error("Error updating company:", error);
      throw createApiError("Failed to update company", 500);
    }
  })
);

// Delete company
router.delete(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createApiError("Authentication required", 401);
    }

    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      throw createApiError("Invalid company ID", 400);
    }

    try {
      const database = await getDatabase();

      const result = await database.collection("companies").deleteOne({
        _id: new ObjectId(id),
        organizationId: new ObjectId(req.user.organizationId),
      });

      if (result.deletedCount === 0) {
        throw createApiError("Company not found", 404);
      }

      res.json({
        success: true,
        message: "Company deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting company:", error);
      throw createApiError("Failed to delete company", 500);
    }
  })
);

export default router;

// Get all companies for organization
router.get(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createApiError("Authentication required", 401);
    }

    const { page = 1, limit = 20, search } = req.query;

    // Mock companies data
    const mockCompanies = [
      {
        _id: "company1",
        name: "TechCorp Solutions",
        industry: "Technology",
        website: "https://techcorp.com",
        email: "info@techcorp.com",
        phone: "+1 (555) 123-4567",
        size: "201-1000",
        address: {
          street: "123 Tech Street",
          city: "San Francisco",
          state: "CA",
          country: "USA",
          zipCode: "94105",
        },
        description: "Leading technology solutions provider",
        contactsCount: 15,
        dealsValue: 125000,
        createdAt: "2025-01-15",
        updatedAt: "2025-08-01",
      },
      {
        _id: "company2",
        name: "Global Marketing Inc",
        industry: "Marketing",
        website: "https://globalmarketing.com",
        email: "contact@globalmarketing.com",
        phone: "+1 (555) 987-6543",
        size: "51-200",
        address: {
          street: "456 Business Ave",
          city: "New York",
          state: "NY",
          country: "USA",
          zipCode: "10001",
        },
        description: "Full-service marketing and advertising agency",
        contactsCount: 8,
        dealsValue: 75000,
        createdAt: "2025-02-20",
        updatedAt: "2025-07-28",
      },
      {
        _id: "company3",
        name: "Innovative Startups LLC",
        industry: "Consulting",
        website: "https://innovativestartups.com",
        email: "hello@innovativestartups.com",
        phone: "+1 (555) 456-7890",
        size: "11-50",
        address: {
          street: "789 Innovation Blvd",
          city: "Austin",
          state: "TX",
          country: "USA",
          zipCode: "73301",
        },
        description: "Helping startups scale and grow",
        contactsCount: 12,
        dealsValue: 90000,
        createdAt: "2025-03-10",
        updatedAt: "2025-08-05",
      },
      {
        _id: "company4",
        name: "RetailPro Systems",
        industry: "Retail",
        website: "https://retailpro.com",
        email: "support@retailpro.com",
        phone: "+1 (555) 321-0987",
        size: "1000+",
        address: {
          street: "321 Retail Plaza",
          city: "Chicago",
          state: "IL",
          country: "USA",
          zipCode: "60601",
        },
        description: "Point-of-sale and retail management solutions",
        contactsCount: 25,
        dealsValue: 200000,
        createdAt: "2024-12-01",
        updatedAt: "2025-07-15",
      },
      {
        _id: "company5",
        name: "HealthTech Innovations",
        industry: "Healthcare",
        website: "https://healthtech.com",
        email: "info@healthtech.com",
        phone: "+1 (555) 654-3210",
        size: "201-1000",
        address: {
          street: "555 Medical Center Dr",
          city: "Boston",
          state: "MA",
          country: "USA",
          zipCode: "02101",
        },
        description: "Digital health and medical technology solutions",
        contactsCount: 18,
        dealsValue: 150000,
        createdAt: "2025-01-25",
        updatedAt: "2025-08-08",
      },
    ];

    let filteredCompanies = mockCompanies;

    // Apply search filter if provided
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredCompanies = mockCompanies.filter(
        (company) =>
          company.name.toLowerCase().includes(searchTerm) ||
          company.industry.toLowerCase().includes(searchTerm) ||
          company.description.toLowerCase().includes(searchTerm) ||
          company.email?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply pagination
    const skip = (Number(page) - 1) * Number(limit);
    const paginatedCompanies = filteredCompanies.slice(
      skip,
      skip + Number(limit)
    );

    res.json({
      success: true,
      data: {
        companies: paginatedCompanies,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: filteredCompanies.length,
          pages: Math.ceil(filteredCompanies.length / Number(limit)),
        },
      },
    });
  })
);

// Search companies (dedicated search endpoint)
router.get(
  "/search",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createApiError("Authentication required", 401);
    }

    const { q: query, limit = 10 } = req.query;

    if (!query) {
      return res.json({
        success: true,
        data: { companies: [] },
      });
    }

    // Simplified company data for search results
    const mockCompanies = [
      {
        _id: "company1",
        name: "TechCorp Solutions",
        industry: "Technology",
        website: "https://techcorp.com",
        email: "info@techcorp.com",
        description: "Leading technology solutions provider",
      },
      {
        _id: "company2",
        name: "Global Marketing Inc",
        industry: "Marketing",
        website: "https://globalmarketing.com",
        email: "contact@globalmarketing.com",
        description: "Full-service marketing and advertising agency",
      },
      {
        _id: "company3",
        name: "Innovative Startups LLC",
        industry: "Consulting",
        website: "https://innovativestartups.com",
        email: "hello@innovativestartups.com",
        description: "Helping startups scale and grow",
      },
      {
        _id: "company4",
        name: "RetailPro Systems",
        industry: "Retail",
        website: "https://retailpro.com",
        email: "support@retailpro.com",
        description: "Point-of-sale and retail management solutions",
      },
      {
        _id: "company5",
        name: "HealthTech Innovations",
        industry: "Healthcare",
        website: "https://healthtech.com",
        email: "info@healthtech.com",
        description: "Digital health and medical technology solutions",
      },
    ];

    const searchTerm = (query as string).toLowerCase();
    const filteredCompanies = mockCompanies
      .filter(
        (company) =>
          company.name.toLowerCase().includes(searchTerm) ||
          company.industry.toLowerCase().includes(searchTerm) ||
          company.description.toLowerCase().includes(searchTerm) ||
          company.email?.toLowerCase().includes(searchTerm)
      )
      .slice(0, Number(limit));

    res.json({
      success: true,
      data: { companies: filteredCompanies },
    });
  })
);

// Create new company
router.post(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createApiError("Authentication required", 401);
    }

    res.status(201).json({
      success: true,
      message: "Company creation - Coming soon",
    });
  })
);

export { router as companiesRouter };
