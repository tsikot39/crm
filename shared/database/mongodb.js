"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseHelper = exports.COLLECTIONS = void 0;
exports.connectToDatabase = connectToDatabase;
exports.disconnectFromDatabase = disconnectFromDatabase;
exports.getDatabase = getDatabase;
exports.getCollection = getCollection;
const mongodb_1 = require("mongodb");
const MONGODB_URI = process.env.DATABASE_URL || 'mongodb+srv://tsikot39:n4w5rb@cluster0.3f8yqnc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DATABASE_NAME = process.env.DATABASE_NAME || 'crm_saas_platform';
if (!MONGODB_URI) {
    throw new Error('Please define the DATABASE_URL or MONGODB_URI environment variable');
}
let cachedClient = null;
let cachedDb = null;
// Connection options for optimal performance
const options = {
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4 // Use IPv4, skip trying IPv6
};
async function connectToDatabase() {
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }
    try {
        const client = new mongodb_1.MongoClient(MONGODB_URI, options);
        await client.connect();
        const db = client.db(DATABASE_NAME);
        cachedClient = client;
        cachedDb = db;
        console.log('✅ Connected to MongoDB Atlas successfully');
        return { client, db };
    }
    catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
}
async function disconnectFromDatabase() {
    if (cachedClient) {
        await cachedClient.close();
        cachedClient = null;
        cachedDb = null;
        console.log('🔌 Disconnected from MongoDB');
    }
}
/**
 * Get database instance
 */
function getDatabase() {
    if (!cachedDb) {
        throw new Error('Database not connected. Call connectToDatabase() first.');
    }
    return cachedDb;
}
/**
 * Get a typed collection
 */
function getCollection(collectionName) {
    const database = getDatabase();
    return database.collection(collectionName);
}
// Database collections
exports.COLLECTIONS = {
    USERS: 'users',
    CONTACTS: 'contacts',
    COMPANIES: 'companies',
    DEALS: 'deals',
    ACTIVITIES: 'activities',
    ORGANIZATIONS: 'organizations',
};
// Helper functions for common database operations
class DatabaseHelper {
    /**
     * Create indexes for better query performance
     */
    static async createIndexes() {
        const database = getDatabase();
        try {
            // Users collection indexes
            await database.collection(exports.COLLECTIONS.USERS).createIndexes([
                { key: { email: 1 }, unique: true },
                { key: { organizationId: 1 } },
                { key: { role: 1 } }
            ]);
            // Contacts collection indexes
            await database.collection(exports.COLLECTIONS.CONTACTS).createIndexes([
                { key: { email: 1 } },
                { key: { organizationId: 1 } },
                { key: { companyId: 1 } },
                { key: { assignedTo: 1 } },
                { key: { status: 1 } },
                { key: { tags: 1 } }
            ]);
            // Companies collection indexes
            await database.collection(exports.COLLECTIONS.COMPANIES).createIndexes([
                { key: { name: 1 } },
                { key: { organizationId: 1 } },
                { key: { assignedTo: 1 } },
                { key: { status: 1 } },
                { key: { industry: 1 } }
            ]);
            // Deals collection indexes
            await database.collection(exports.COLLECTIONS.DEALS).createIndexes([
                { key: { organizationId: 1 } },
                { key: { assignedTo: 1 } },
                { key: { stage: 1 } },
                { key: { contactId: 1 } },
                { key: { companyId: 1 } },
                { key: { expectedCloseDate: 1 } }
            ]);
            // Activities collection indexes
            await database.collection(exports.COLLECTIONS.ACTIVITIES).createIndexes([
                { key: { organizationId: 1 } },
                { key: { assignedTo: 1 } },
                { key: { type: 1 } },
                { key: { status: 1 } },
                { key: { dueDate: 1 } },
                { key: { contactId: 1 } },
                { key: { companyId: 1 } },
                { key: { dealId: 1 } }
            ]);
            // Organizations collection indexes
            await database.collection(exports.COLLECTIONS.ORGANIZATIONS).createIndexes([
                { key: { slug: 1 }, unique: true },
                { key: { status: 1 } }
            ]);
            console.log('📊 Database indexes created successfully');
        }
        catch (error) {
            console.error('❌ Error creating database indexes:', error);
            throw error;
        }
    }
    /**
     * Initialize database with default data
     */
    static async initializeDatabase() {
        try {
            await DatabaseHelper.createIndexes();
            console.log('🚀 Database initialized successfully');
        }
        catch (error) {
            console.error('❌ Error initializing database:', error);
            throw error;
        }
    }
    /**
     * Health check for database connection
     */
    static async healthCheck() {
        try {
            const database = getDatabase();
            await database.admin().ping();
            return true;
        }
        catch (error) {
            console.error('❌ Database health check failed:', error);
            return false;
        }
    }
}
exports.DatabaseHelper = DatabaseHelper;
//# sourceMappingURL=mongodb.js.map