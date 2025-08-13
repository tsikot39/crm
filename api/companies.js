import { MongoClient, ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

// MongoDB connection
const client = new MongoClient(process.env.MONGODB_URI);
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;

  await client.connect();
  cachedDb = client.db("crm_saas_platform");
  return cachedDb;
}

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization required",
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    const db = await connectToDatabase();

    if (req.method === "GET") {
      // Get companies with pagination and search
      const { page = 1, limit = 20, search } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      let query = { organizationId: decoded.organizationId };

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { industry: { $regex: search, $options: "i" } },
          { website: { $regex: search, $options: "i" } },
          { location: { $regex: search, $options: "i" } },
        ];
      }

      // Get companies with contact counts using aggregation
      const companies = await db
        .collection("companies")
        .aggregate([
          { $match: query },
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: parseInt(limit) },
          {
            $lookup: {
              from: "contacts",
              let: { companyId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ["$companyId", "$$companyId"] },
                  },
                },
                { $count: "count" },
              ],
              as: "contactCounts",
            },
          },
          {
            $addFields: {
              contactCount: {
                $ifNull: [{ $arrayElemAt: ["$contactCounts.count", 0] }, 0],
              },
            },
          },
          {
            $project: {
              contactCounts: 0,
            },
          },
        ])
        .toArray();

      const total = await db.collection("companies").countDocuments(query);

      const transformedCompanies = companies.map((company) => ({
        id: company._id.toString(),
        name: company.name,
        website: company.website,
        industry: company.industry,
        size: company.size,
        revenue: company.revenue || 0,
        location: company.location,
        primaryContact: company.primaryContact,
        contactCount: company.contactCount,
        dealCount: company.dealCount || 0,
        lastActivity: company.lastActivity,
        status: company.status,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      }));

      return res.status(200).json({
        success: true,
        data: {
          companies: transformedCompanies,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
          },
        },
      });
    } else if (req.method === "POST") {
      // Create new company
      const companyData = req.body;

      const newCompany = {
        organizationId: decoded.organizationId,
        name: companyData.name,
        website: companyData.website || "",
        industry: companyData.industry,
        size: companyData.size,
        revenue: companyData.revenue || 0,
        location: companyData.location,
        primaryContact: companyData.primaryContact || "",
        status: companyData.status || "active",
        contactCount: 0,
        dealCount: 0,
        lastActivity: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection("companies").insertOne(newCompany);

      return res.status(201).json({
        success: true,
        message: "Company created successfully",
        data: {
          company: {
            id: result.insertedId.toString(),
            ...newCompany,
          },
        },
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Companies API error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
