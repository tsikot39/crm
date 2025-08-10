"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizationRepository = exports.activityRepository = exports.dealRepository = exports.companyRepository = exports.contactRepository = exports.userRepository = exports.OrganizationRepository = exports.ActivityRepository = exports.DealRepository = exports.CompanyRepository = exports.ContactRepository = exports.UserRepository = exports.BaseRepository = void 0;
const mongodb_1 = require("mongodb");
const mongodb_2 = require("./mongodb");
// Base repository class with common CRUD operations
class BaseRepository {
    /**
     * Create a new document
     */
    async create(document) {
        const collection = (0, mongodb_2.getCollection)(this.collectionName);
        const now = new Date();
        const newDocument = {
            ...document,
            createdAt: now,
            updatedAt: now,
        };
        const result = await collection.insertOne(newDocument);
        return { ...newDocument, _id: result.insertedId };
    }
    /**
     * Find documents by filter
     */
    async find(filter = {}, options) {
        const collection = (0, mongodb_2.getCollection)(this.collectionName);
        return collection.find(filter, options).toArray();
    }
    /**
     * Find a single document by ID
     */
    async findById(id) {
        const collection = (0, mongodb_2.getCollection)(this.collectionName);
        const objectId = typeof id === 'string' ? new mongodb_1.ObjectId(id) : id;
        return collection.findOne({ _id: objectId });
    }
    /**
     * Find a single document by filter
     */
    async findOne(filter) {
        const collection = (0, mongodb_2.getCollection)(this.collectionName);
        return collection.findOne(filter);
    }
    /**
     * Update a document by ID
     */
    async updateById(id, update) {
        const collection = (0, mongodb_2.getCollection)(this.collectionName);
        const objectId = typeof id === 'string' ? new mongodb_1.ObjectId(id) : id;
        const updateDoc = {
            ...update,
            $set: {
                ...update.$set,
                updatedAt: new Date(),
            },
        };
        const result = await collection.findOneAndUpdate({ _id: objectId }, updateDoc, { returnDocument: 'after' });
        return result.value;
    }
    /**
     * Delete a document by ID
     */
    async deleteById(id) {
        const collection = (0, mongodb_2.getCollection)(this.collectionName);
        const objectId = typeof id === 'string' ? new mongodb_1.ObjectId(id) : id;
        const result = await collection.deleteOne({ _id: objectId });
        return result.deletedCount > 0;
    }
    /**
     * Count documents by filter
     */
    async count(filter = {}) {
        const collection = (0, mongodb_2.getCollection)(this.collectionName);
        return collection.countDocuments(filter);
    }
    /**
     * Check if a document exists
     */
    async exists(filter) {
        const count = await this.count(filter);
        return count > 0;
    }
}
exports.BaseRepository = BaseRepository;
// User repository
class UserRepository extends BaseRepository {
    constructor() {
        super(...arguments);
        this.collectionName = mongodb_2.COLLECTIONS.USERS;
    }
    async findByEmail(email) {
        return this.findOne({ email });
    }
    async findByOrganization(organizationId) {
        return this.find({ organizationId });
    }
    async updateLastLogin(userId) {
        await this.updateById(userId, {
            $set: { lastLoginAt: new Date() }
        });
    }
}
exports.UserRepository = UserRepository;
// Contact repository
class ContactRepository extends BaseRepository {
    constructor() {
        super(...arguments);
        this.collectionName = mongodb_2.COLLECTIONS.CONTACTS;
    }
    async findByEmail(email) {
        return this.findOne({ email });
    }
    async findByCompany(companyId) {
        return this.find({ companyId });
    }
    async findByAssignedUser(userId) {
        return this.find({ assignedTo: userId });
    }
    async findByStatus(status) {
        return this.find({ status });
    }
    async searchByName(name) {
        const regex = new RegExp(name, 'i');
        return this.find({
            $or: [
                { firstName: { $regex: regex } },
                { lastName: { $regex: regex } }
            ]
        });
    }
}
exports.ContactRepository = ContactRepository;
// Company repository
class CompanyRepository extends BaseRepository {
    constructor() {
        super(...arguments);
        this.collectionName = mongodb_2.COLLECTIONS.COMPANIES;
    }
    async findByName(name) {
        return this.findOne({ name });
    }
    async findByIndustry(industry) {
        return this.find({ industry });
    }
    async findByAssignedUser(userId) {
        return this.find({ assignedTo: userId });
    }
    async searchByName(name) {
        const regex = new RegExp(name, 'i');
        return this.find({ name: { $regex: regex } });
    }
}
exports.CompanyRepository = CompanyRepository;
// Deal repository
class DealRepository extends BaseRepository {
    constructor() {
        super(...arguments);
        this.collectionName = mongodb_2.COLLECTIONS.DEALS;
    }
    async findByStage(stage) {
        return this.find({ stage });
    }
    async findByAssignedUser(userId) {
        return this.find({ assignedTo: userId });
    }
    async findByContact(contactId) {
        return this.find({ contactId });
    }
    async findByCompany(companyId) {
        return this.find({ companyId });
    }
    async getTotalValue(filter = {}) {
        const collection = (0, mongodb_2.getCollection)(this.collectionName);
        const pipeline = [
            { $match: filter },
            { $group: { _id: null, totalValue: { $sum: '$value' } } }
        ];
        const result = await collection.aggregate(pipeline).toArray();
        return result[0]?.totalValue || 0;
    }
    async getWonDeals(organizationId) {
        return this.find({
            organizationId,
            stage: 'closed_won'
        });
    }
}
exports.DealRepository = DealRepository;
// Activity repository
class ActivityRepository extends BaseRepository {
    constructor() {
        super(...arguments);
        this.collectionName = mongodb_2.COLLECTIONS.ACTIVITIES;
    }
    async findByType(type) {
        return this.find({ type });
    }
    async findByAssignedUser(userId) {
        return this.find({ assignedTo: userId });
    }
    async findByContact(contactId) {
        return this.find({ contactId });
    }
    async findByDeal(dealId) {
        return this.find({ dealId });
    }
    async findUpcoming(userId) {
        const today = new Date();
        return this.find({
            assignedTo: userId,
            status: 'pending',
            dueDate: { $gte: today }
        });
    }
    async findOverdue(userId) {
        const today = new Date();
        return this.find({
            assignedTo: userId,
            status: 'pending',
            dueDate: { $lt: today }
        });
    }
}
exports.ActivityRepository = ActivityRepository;
// Organization repository
class OrganizationRepository {
    constructor() {
        this.collectionName = mongodb_2.COLLECTIONS.ORGANIZATIONS;
    }
    async create(organization) {
        const collection = (0, mongodb_2.getCollection)(this.collectionName);
        const now = new Date();
        const newOrg = {
            ...organization,
            createdAt: now,
            updatedAt: now,
        };
        const result = await collection.insertOne(newOrg);
        return { ...newOrg, _id: result.insertedId };
    }
    async findBySlug(slug) {
        const collection = (0, mongodb_2.getCollection)(this.collectionName);
        return collection.findOne({ slug });
    }
    async findById(id) {
        const collection = (0, mongodb_2.getCollection)(this.collectionName);
        const objectId = typeof id === 'string' ? new mongodb_1.ObjectId(id) : id;
        return collection.findOne({ _id: objectId });
    }
    async updateSettings(id, settings) {
        const collection = (0, mongodb_2.getCollection)(this.collectionName);
        const objectId = new mongodb_1.ObjectId(id);
        const result = await collection.findOneAndUpdate({ _id: objectId }, {
            $set: {
                settings: settings,
                updatedAt: new Date()
            }
        }, { returnDocument: 'after' });
        return result.value;
    }
}
exports.OrganizationRepository = OrganizationRepository;
// Export repository instances
exports.userRepository = new UserRepository();
exports.contactRepository = new ContactRepository();
exports.companyRepository = new CompanyRepository();
exports.dealRepository = new DealRepository();
exports.activityRepository = new ActivityRepository();
exports.organizationRepository = new OrganizationRepository();
//# sourceMappingURL=repositories.js.map