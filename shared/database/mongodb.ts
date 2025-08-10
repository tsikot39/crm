import { MongoClient, Db, Collection } from "mongodb";
import { DatabaseCollections } from "./types";

const MONGODB_URI =
  process.env.DATABASE_URL ||
  "mongodb+srv://tsikot39:n4w5rb@cluster0.3f8yqnc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const DATABASE_NAME = process.env.DATABASE_NAME || "crm_saas_platform";

if (!MONGODB_URI) {
  throw new Error(
    "Please define the DATABASE_URL or MONGODB_URI environment variable"
  );
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

// Connection options for optimal performance
const options = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
};

export async function connectToDatabase(): Promise<{
  client: MongoClient;
  db: Db;
}> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = new MongoClient(MONGODB_URI, options);
    await client.connect();

    const db = client.db(DATABASE_NAME);

    cachedClient = client;
    cachedDb = db;

    console.log("✅ Connected to MongoDB Atlas successfully");
    return { client, db };
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}

export async function disconnectFromDatabase(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    console.log("🔌 Disconnected from MongoDB");
  }
}

/**
 * Get database instance
 */
export function getDatabase(): Db {
  if (!cachedDb) {
    throw new Error("Database not connected. Call connectToDatabase() first.");
  }
  return cachedDb;
}

/**
 * Get a typed collection
 */
export function getCollection<T extends keyof DatabaseCollections>(
  collectionName: T
): Collection<DatabaseCollections[T]> {
  const database = getDatabase();
  return database.collection<DatabaseCollections[T]>(collectionName);
}

// Database collections
export const COLLECTIONS = {
  USERS: "users",
  CONTACTS: "contacts",
  COMPANIES: "companies",
  DEALS: "deals",
  ACTIVITIES: "activities",
  ORGANIZATIONS: "organizations",
} as const;

// Helper functions for common database operations
export class DatabaseHelper {
  /**
   * Create indexes for better query performance
   */
  static async createIndexes(): Promise<void> {
    const database = getDatabase();

    try {
      // Users collection indexes
      await database
        .collection(COLLECTIONS.USERS)
        .createIndexes([
          { key: { email: 1 }, unique: true },
          { key: { organizationId: 1 } },
          { key: { role: 1 } },
        ]);

      // Contacts collection indexes
      await database
        .collection(COLLECTIONS.CONTACTS)
        .createIndexes([
          { key: { email: 1 } },
          { key: { organizationId: 1 } },
          { key: { companyId: 1 } },
          { key: { assignedTo: 1 } },
          { key: { status: 1 } },
          { key: { tags: 1 } },
        ]);

      // Companies collection indexes
      await database
        .collection(COLLECTIONS.COMPANIES)
        .createIndexes([
          { key: { name: 1 } },
          { key: { organizationId: 1 } },
          { key: { assignedTo: 1 } },
          { key: { status: 1 } },
          { key: { industry: 1 } },
        ]);

      // Deals collection indexes
      await database
        .collection(COLLECTIONS.DEALS)
        .createIndexes([
          { key: { organizationId: 1 } },
          { key: { assignedTo: 1 } },
          { key: { stage: 1 } },
          { key: { contactId: 1 } },
          { key: { companyId: 1 } },
          { key: { expectedCloseDate: 1 } },
        ]);

      // Activities collection indexes
      await database
        .collection(COLLECTIONS.ACTIVITIES)
        .createIndexes([
          { key: { organizationId: 1 } },
          { key: { assignedTo: 1 } },
          { key: { type: 1 } },
          { key: { status: 1 } },
          { key: { dueDate: 1 } },
          { key: { contactId: 1 } },
          { key: { companyId: 1 } },
          { key: { dealId: 1 } },
        ]);

      // Organizations collection indexes
      await database
        .collection(COLLECTIONS.ORGANIZATIONS)
        .createIndexes([
          { key: { slug: 1 }, unique: true },
          { key: { status: 1 } },
        ]);

      console.log("📊 Database indexes created successfully");
    } catch (error) {
      console.error("❌ Error creating database indexes:", error);
      throw error;
    }
  }

  /**
   * Initialize database with default data
   */
  static async initializeDatabase(): Promise<void> {
    try {
      await DatabaseHelper.createIndexes();
      console.log("🚀 Database initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing database:", error);
      throw error;
    }
  }

  /**
   * Health check for database connection
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const database = getDatabase();
      await database.admin().ping();
      return true;
    } catch (error) {
      console.error("❌ Database health check failed:", error);
      return false;
    }
  }
}
