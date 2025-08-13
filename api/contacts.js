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
      // Get contacts with pagination and search
      const { page = 1, limit = 20, search } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      let query = { organizationId: decoded.organizationId };

      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { jobTitle: { $regex: search, $options: "i" } },
        ];
      }

      const contacts = await db
        .collection("contacts")
        .aggregate([
          { $match: query },
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: parseInt(limit) },
          {
            $lookup: {
              from: "companies",
              localField: "companyId",
              foreignField: "_id",
              as: "companyData",
            },
          },
          {
            $addFields: {
              company: { $arrayElemAt: ["$companyData", 0] },
            },
          },
        ])
        .toArray();

      const total = await db.collection("contacts").countDocuments(query);

      const transformedContacts = contacts.map((contact) => ({
        _id: contact._id.toString(),
        name: `${contact.firstName} ${contact.lastName}`,
        email: contact.email,
        phone: contact.phone || "",
        company: contact.company ? contact.company.name : "No company",
        companyId: contact.companyId ? contact.companyId.toString() : null,
        jobTitle: contact.jobTitle || "",
        status: contact.status || "active",
        tags: contact.tags || [],
        lastContact: contact.lastContact || contact.createdAt,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      }));

      return res.status(200).json({
        success: true,
        data: {
          contacts: transformedContacts,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
          },
        },
      });
    } else if (req.method === "POST") {
      // Create new contact
      const contactData = req.body;

      const newContact = {
        organizationId: decoded.organizationId,
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        email: contactData.email,
        phone: contactData.phone || "",
        companyId: contactData.companyId
          ? new ObjectId(contactData.companyId)
          : null,
        jobTitle: contactData.jobTitle || "",
        status: contactData.status || "active",
        tags: contactData.tags || [],
        lastContact: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection("contacts").insertOne(newContact);

      return res.status(201).json({
        success: true,
        message: "Contact created successfully",
        data: {
          contact: {
            id: result.insertedId.toString(),
            ...newContact,
          },
        },
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Contacts API error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
