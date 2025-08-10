import { ObjectId, Filter, UpdateFilter, FindOptions } from "mongodb";
import { getCollection, COLLECTIONS } from "./mongodb";
import {
  UserDocument,
  ContactDocument,
  CompanyDocument,
  DealDocument,
  ActivityDocument,
  OrganizationDocument,
  BaseDocument,
} from "./types";

// Base repository class with common CRUD operations
export abstract class BaseRepository<T extends BaseDocument> {
  protected abstract collectionName: string;

  /**
   * Create a new document
   */
  async create(
    document: Omit<T, "_id" | "createdAt" | "updatedAt">
  ): Promise<T> {
    const collection = getCollection(this.collectionName as any);
    const now = new Date();

    const newDocument = {
      ...document,
      createdAt: now,
      updatedAt: now,
    } as T;

    const result = await collection.insertOne(newDocument);
    return { ...newDocument, _id: result.insertedId } as T;
  }

  /**
   * Find documents by filter
   */
  async find(filter: Filter<T> = {}, options?: FindOptions<T>): Promise<T[]> {
    const collection = getCollection(this.collectionName as any);
    return collection.find(filter, options).toArray();
  }

  /**
   * Find a single document by ID
   */
  async findById(id: string | ObjectId): Promise<T | null> {
    const collection = getCollection(this.collectionName as any);
    const objectId = typeof id === "string" ? new ObjectId(id) : id;
    return collection.findOne({ _id: objectId } as Filter<T>);
  }

  /**
   * Find a single document by filter
   */
  async findOne(filter: Filter<T>): Promise<T | null> {
    const collection = getCollection(this.collectionName as any);
    return collection.findOne(filter);
  }

  /**
   * Update a document by ID
   */
  async updateById(
    id: string | ObjectId,
    update: UpdateFilter<T>
  ): Promise<T | null> {
    const collection = getCollection(this.collectionName as any);
    const objectId = typeof id === "string" ? new ObjectId(id) : id;

    const updateDoc = {
      ...update,
      $set: {
        ...update.$set,
        updatedAt: new Date(),
      },
    };

    const result = await collection.findOneAndUpdate(
      { _id: objectId } as Filter<T>,
      updateDoc,
      { returnDocument: "after" }
    );

    return result.value;
  }

  /**
   * Delete a document by ID
   */
  async deleteById(id: string | ObjectId): Promise<boolean> {
    const collection = getCollection(this.collectionName as any);
    const objectId = typeof id === "string" ? new ObjectId(id) : id;

    const result = await collection.deleteOne({ _id: objectId } as Filter<T>);
    return result.deletedCount > 0;
  }

  /**
   * Count documents by filter
   */
  async count(filter: Filter<T> = {}): Promise<number> {
    const collection = getCollection(this.collectionName as any);
    return collection.countDocuments(filter);
  }

  /**
   * Check if a document exists
   */
  async exists(filter: Filter<T>): Promise<boolean> {
    const count = await this.count(filter);
    return count > 0;
  }
}

// User repository
export class UserRepository extends BaseRepository<UserDocument> {
  protected collectionName = COLLECTIONS.USERS;

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.findOne({ email });
  }

  async findByOrganization(organizationId: string): Promise<UserDocument[]> {
    return this.find({ organizationId });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.updateById(userId, {
      $set: { lastLoginAt: new Date() },
    });
  }
}

// Contact repository
export class ContactRepository extends BaseRepository<ContactDocument> {
  protected collectionName = COLLECTIONS.CONTACTS;

  async findByEmail(email: string): Promise<ContactDocument | null> {
    return this.findOne({ email });
  }

  async findByCompany(companyId: string): Promise<ContactDocument[]> {
    return this.find({ companyId });
  }

  async findByAssignedUser(userId: string): Promise<ContactDocument[]> {
    return this.find({ assignedTo: userId });
  }

  async findByStatus(
    status: ContactDocument["status"]
  ): Promise<ContactDocument[]> {
    return this.find({ status });
  }

  async searchByName(name: string): Promise<ContactDocument[]> {
    const regex = new RegExp(name, "i");
    return this.find({
      $or: [{ firstName: { $regex: regex } }, { lastName: { $regex: regex } }],
    });
  }
}

// Company repository
export class CompanyRepository extends BaseRepository<CompanyDocument> {
  protected collectionName = COLLECTIONS.COMPANIES;

  async findByName(name: string): Promise<CompanyDocument | null> {
    return this.findOne({ name });
  }

  async findByIndustry(industry: string): Promise<CompanyDocument[]> {
    return this.find({ industry });
  }

  async findByAssignedUser(userId: string): Promise<CompanyDocument[]> {
    return this.find({ assignedTo: userId });
  }

  async searchByName(name: string): Promise<CompanyDocument[]> {
    const regex = new RegExp(name, "i");
    return this.find({ name: { $regex: regex } });
  }
}

// Deal repository
export class DealRepository extends BaseRepository<DealDocument> {
  protected collectionName = COLLECTIONS.DEALS;

  async findByStage(stage: DealDocument["stage"]): Promise<DealDocument[]> {
    return this.find({ stage });
  }

  async findByAssignedUser(userId: string): Promise<DealDocument[]> {
    return this.find({ assignedTo: userId });
  }

  async findByContact(contactId: string): Promise<DealDocument[]> {
    return this.find({ contactId });
  }

  async findByCompany(companyId: string): Promise<DealDocument[]> {
    return this.find({ companyId });
  }

  async getTotalValue(filter: Filter<DealDocument> = {}): Promise<number> {
    const collection = getCollection(this.collectionName as any);
    const pipeline = [
      { $match: filter },
      { $group: { _id: null, totalValue: { $sum: "$value" } } },
    ];

    const result = await collection.aggregate(pipeline).toArray();
    return result[0]?.totalValue || 0;
  }

  async getWonDeals(organizationId: string): Promise<DealDocument[]> {
    return this.find({
      organizationId,
      stage: "closed_won",
    });
  }
}

// Activity repository
export class ActivityRepository extends BaseRepository<ActivityDocument> {
  protected collectionName = COLLECTIONS.ACTIVITIES;

  async findByType(
    type: ActivityDocument["type"]
  ): Promise<ActivityDocument[]> {
    return this.find({ type });
  }

  async findByAssignedUser(userId: string): Promise<ActivityDocument[]> {
    return this.find({ assignedTo: userId });
  }

  async findByContact(contactId: string): Promise<ActivityDocument[]> {
    return this.find({ contactId });
  }

  async findByDeal(dealId: string): Promise<ActivityDocument[]> {
    return this.find({ dealId });
  }

  async findUpcoming(userId: string): Promise<ActivityDocument[]> {
    const today = new Date();
    return this.find({
      assignedTo: userId,
      status: "pending",
      dueDate: { $gte: today },
    });
  }

  async findOverdue(userId: string): Promise<ActivityDocument[]> {
    const today = new Date();
    return this.find({
      assignedTo: userId,
      status: "pending",
      dueDate: { $lt: today },
    });
  }
}

// Organization repository
export class OrganizationRepository {
  private collectionName = COLLECTIONS.ORGANIZATIONS;

  async create(
    organization: Omit<OrganizationDocument, "_id" | "createdAt" | "updatedAt">
  ): Promise<OrganizationDocument> {
    const collection = getCollection(this.collectionName as any);
    const now = new Date();

    const newOrg = {
      ...organization,
      createdAt: now,
      updatedAt: now,
    } as OrganizationDocument;

    const result = await collection.insertOne(newOrg);
    return { ...newOrg, _id: result.insertedId };
  }

  async findBySlug(slug: string): Promise<OrganizationDocument | null> {
    const collection = getCollection(this.collectionName as any);
    return collection.findOne({ slug });
  }

  async findById(id: string | ObjectId): Promise<OrganizationDocument | null> {
    const collection = getCollection(this.collectionName as any);
    const objectId = typeof id === "string" ? new ObjectId(id) : id;
    return collection.findOne({ _id: objectId });
  }

  async updateSettings(
    id: string,
    settings: Partial<OrganizationDocument["settings"]>
  ): Promise<OrganizationDocument | null> {
    const collection = getCollection(this.collectionName as any);
    const objectId = new ObjectId(id);

    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      {
        $set: {
          settings: settings,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    return result.value;
  }
}

// Export repository instances
export const userRepository = new UserRepository();
export const contactRepository = new ContactRepository();
export const companyRepository = new CompanyRepository();
export const dealRepository = new DealRepository();
export const activityRepository = new ActivityRepository();
export const organizationRepository = new OrganizationRepository();
