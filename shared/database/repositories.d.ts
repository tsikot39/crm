import { ObjectId, Filter, UpdateFilter, FindOptions } from 'mongodb';
import { UserDocument, ContactDocument, CompanyDocument, DealDocument, ActivityDocument, OrganizationDocument, BaseDocument } from './types';
export declare abstract class BaseRepository<T extends BaseDocument> {
    protected abstract collectionName: string;
    /**
     * Create a new document
     */
    create(document: Omit<T, '_id' | 'createdAt' | 'updatedAt'>): Promise<T>;
    /**
     * Find documents by filter
     */
    find(filter?: Filter<T>, options?: FindOptions<T>): Promise<T[]>;
    /**
     * Find a single document by ID
     */
    findById(id: string | ObjectId): Promise<T | null>;
    /**
     * Find a single document by filter
     */
    findOne(filter: Filter<T>): Promise<T | null>;
    /**
     * Update a document by ID
     */
    updateById(id: string | ObjectId, update: UpdateFilter<T>): Promise<T | null>;
    /**
     * Delete a document by ID
     */
    deleteById(id: string | ObjectId): Promise<boolean>;
    /**
     * Count documents by filter
     */
    count(filter?: Filter<T>): Promise<number>;
    /**
     * Check if a document exists
     */
    exists(filter: Filter<T>): Promise<boolean>;
}
export declare class UserRepository extends BaseRepository<UserDocument> {
    protected collectionName: "users";
    findByEmail(email: string): Promise<UserDocument | null>;
    findByOrganization(organizationId: string): Promise<UserDocument[]>;
    updateLastLogin(userId: string): Promise<void>;
}
export declare class ContactRepository extends BaseRepository<ContactDocument> {
    protected collectionName: "contacts";
    findByEmail(email: string): Promise<ContactDocument | null>;
    findByCompany(companyId: string): Promise<ContactDocument[]>;
    findByAssignedUser(userId: string): Promise<ContactDocument[]>;
    findByStatus(status: ContactDocument['status']): Promise<ContactDocument[]>;
    searchByName(name: string): Promise<ContactDocument[]>;
}
export declare class CompanyRepository extends BaseRepository<CompanyDocument> {
    protected collectionName: "companies";
    findByName(name: string): Promise<CompanyDocument | null>;
    findByIndustry(industry: string): Promise<CompanyDocument[]>;
    findByAssignedUser(userId: string): Promise<CompanyDocument[]>;
    searchByName(name: string): Promise<CompanyDocument[]>;
}
export declare class DealRepository extends BaseRepository<DealDocument> {
    protected collectionName: "deals";
    findByStage(stage: DealDocument['stage']): Promise<DealDocument[]>;
    findByAssignedUser(userId: string): Promise<DealDocument[]>;
    findByContact(contactId: string): Promise<DealDocument[]>;
    findByCompany(companyId: string): Promise<DealDocument[]>;
    getTotalValue(filter?: Filter<DealDocument>): Promise<number>;
    getWonDeals(organizationId: string): Promise<DealDocument[]>;
}
export declare class ActivityRepository extends BaseRepository<ActivityDocument> {
    protected collectionName: "activities";
    findByType(type: ActivityDocument['type']): Promise<ActivityDocument[]>;
    findByAssignedUser(userId: string): Promise<ActivityDocument[]>;
    findByContact(contactId: string): Promise<ActivityDocument[]>;
    findByDeal(dealId: string): Promise<ActivityDocument[]>;
    findUpcoming(userId: string): Promise<ActivityDocument[]>;
    findOverdue(userId: string): Promise<ActivityDocument[]>;
}
export declare class OrganizationRepository {
    private collectionName;
    create(organization: Omit<OrganizationDocument, '_id' | 'createdAt' | 'updatedAt'>): Promise<OrganizationDocument>;
    findBySlug(slug: string): Promise<OrganizationDocument | null>;
    findById(id: string | ObjectId): Promise<OrganizationDocument | null>;
    updateSettings(id: string, settings: Partial<OrganizationDocument['settings']>): Promise<OrganizationDocument | null>;
}
export declare const userRepository: UserRepository;
export declare const contactRepository: ContactRepository;
export declare const companyRepository: CompanyRepository;
export declare const dealRepository: DealRepository;
export declare const activityRepository: ActivityRepository;
export declare const organizationRepository: OrganizationRepository;
//# sourceMappingURL=repositories.d.ts.map