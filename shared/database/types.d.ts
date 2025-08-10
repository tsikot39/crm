import { ObjectId } from 'mongodb';
export interface BaseDocument {
    _id?: ObjectId;
    createdAt: Date;
    updatedAt: Date;
    organizationId: string;
}
export interface UserDocument extends BaseDocument {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: 'admin' | 'manager' | 'sales_rep' | 'viewer';
    isActive: boolean;
    lastLoginAt?: Date;
    preferences?: {
        theme: 'light' | 'dark';
        notifications: boolean;
        timezone: string;
    };
}
export interface ContactDocument extends BaseDocument {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    companyId?: string;
    tags: string[];
    notes?: string;
    socialMedia?: {
        linkedin?: string;
        twitter?: string;
    };
    address?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        zipCode?: string;
    };
    assignedTo?: string;
    leadSource?: string;
    status: 'lead' | 'prospect' | 'customer' | 'inactive';
}
export interface CompanyDocument extends BaseDocument {
    name: string;
    website?: string;
    industry?: string;
    size?: 'startup' | 'small' | 'medium' | 'enterprise';
    revenue?: number;
    description?: string;
    tags: string[];
    address?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        zipCode?: string;
    };
    assignedTo?: string;
    status: 'prospect' | 'customer' | 'partner' | 'inactive';
}
export interface DealDocument extends BaseDocument {
    title: string;
    description?: string;
    value: number;
    currency: string;
    stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
    probability: number;
    expectedCloseDate?: Date;
    actualCloseDate?: Date;
    contactId?: string;
    companyId?: string;
    assignedTo: string;
    tags: string[];
    notes?: string;
    activities?: ActivityDocument[];
}
export interface ActivityDocument extends BaseDocument {
    type: 'call' | 'email' | 'meeting' | 'task' | 'note';
    subject: string;
    description?: string;
    dueDate?: Date;
    completedAt?: Date;
    contactId?: string;
    companyId?: string;
    dealId?: string;
    assignedTo: string;
    createdBy: string;
    status: 'pending' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high';
}
export interface OrganizationDocument {
    _id?: ObjectId;
    name: string;
    slug: string;
    plan: 'starter' | 'professional' | 'enterprise';
    status: 'active' | 'suspended' | 'cancelled';
    settings: {
        currency: string;
        timezone: string;
        dateFormat: string;
        features: string[];
    };
    billing: {
        subscriptionId?: string;
        currentPeriodStart: Date;
        currentPeriodEnd: Date;
        customerId?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}
export type DatabaseCollections = {
    users: UserDocument;
    contacts: ContactDocument;
    companies: CompanyDocument;
    deals: DealDocument;
    activities: ActivityDocument;
    organizations: OrganizationDocument;
};
//# sourceMappingURL=types.d.ts.map