import { MongoClient, Db, Collection } from 'mongodb';
import { DatabaseCollections } from './types';
export declare function connectToDatabase(): Promise<{
    client: MongoClient;
    db: Db;
}>;
export declare function disconnectFromDatabase(): Promise<void>;
/**
 * Get database instance
 */
export declare function getDatabase(): Db;
/**
 * Get a typed collection
 */
export declare function getCollection<T extends keyof DatabaseCollections>(collectionName: T): Collection<DatabaseCollections[T]>;
export declare const COLLECTIONS: {
    readonly USERS: "users";
    readonly CONTACTS: "contacts";
    readonly COMPANIES: "companies";
    readonly DEALS: "deals";
    readonly ACTIVITIES: "activities";
    readonly ORGANIZATIONS: "organizations";
};
export declare class DatabaseHelper {
    /**
     * Create indexes for better query performance
     */
    static createIndexes(): Promise<void>;
    /**
     * Initialize database with default data
     */
    static initializeDatabase(): Promise<void>;
    /**
     * Health check for database connection
     */
    static healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=mongodb.d.ts.map