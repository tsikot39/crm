import { z } from "zod";

// =====================================================
// User & Authentication Types
// =====================================================

export const UserRoleSchema = z.enum([
  "admin",
  "manager",
  "sales_rep",
  "viewer",
]);
export const UserStatusSchema = z.enum(["active", "inactive", "pending"]);

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  avatar: z.string().optional(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  organizationId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastLoginAt: z.date().optional(),
});

export const AuthTokenSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  tokenType: z.literal("Bearer"),
});

// =====================================================
// Organization Types
// =====================================================

export const OrganizationPlanSchema = z.enum([
  "starter",
  "professional",
  "enterprise",
]);
export const OrganizationStatusSchema = z.enum([
  "trial",
  "active",
  "suspended",
  "cancelled",
]);

export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  domain: z.string().optional(),
  plan: OrganizationPlanSchema,
  status: OrganizationStatusSchema,
  settings: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  trialEndsAt: z.date().optional(),
});

// =====================================================
// Contact Types
// =====================================================

export const ContactTypeSchema = z.enum(["lead", "customer", "prospect"]);
export const ContactSourceSchema = z.enum([
  "website",
  "referral",
  "social_media",
  "email",
  "phone",
  "event",
  "other",
]);

export const ContactSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  type: ContactTypeSchema,
  source: ContactSourceSchema,
  title: z.string().optional(),
  company: z.string().optional(),
  website: z.string().url().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  customFields: z.record(z.any()).optional(),
  organizationId: z.string(),
  assignedToId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastContactedAt: z.date().optional(),
});

// =====================================================
// Deal Types
// =====================================================

export const DealStageSchema = z.enum([
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
]);

export const DealPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);

export const DealSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  value: z.number().min(0),
  currency: z.string().default("USD"),
  stage: DealStageSchema,
  priority: DealPrioritySchema,
  probability: z.number().min(0).max(100),
  expectedCloseDate: z.date().optional(),
  actualCloseDate: z.date().optional(),
  contactId: z.string(),
  assignedToId: z.string(),
  organizationId: z.string(),
  tags: z.array(z.string()).default([]),
  customFields: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// =====================================================
// Activity Types
// =====================================================

export const ActivityTypeSchema = z.enum([
  "call",
  "email",
  "meeting",
  "note",
  "task",
  "deal_created",
  "deal_updated",
  "contact_created",
  "contact_updated",
]);

export const ActivitySchema = z.object({
  id: z.string(),
  type: ActivityTypeSchema,
  title: z.string(),
  description: z.string().optional(),
  completed: z.boolean().default(false),
  dueDate: z.date().optional(),
  completedAt: z.date().optional(),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
  userId: z.string(),
  organizationId: z.string(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// =====================================================
// API Response Types
// =====================================================

export const PaginationSchema = z.object({
  page: z.number().min(1),
  limit: z.number().min(1).max(100),
  total: z.number(),
  totalPages: z.number(),
});

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    message: z.string().optional(),
    pagination: PaginationSchema.optional(),
  });

export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string(),
  statusCode: z.number(),
  timestamp: z.string(),
});

// =====================================================
// WebSocket Event Types
// =====================================================

export const WebSocketEventSchema = z.object({
  type: z.string(),
  payload: z.any(),
  userId: z.string().optional(),
  organizationId: z.string(),
  timestamp: z.date(),
});

// =====================================================
// Form Validation Schemas
// =====================================================

export const CreateContactSchema = ContactSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastContactedAt: true,
});

export const UpdateContactSchema = CreateContactSchema.partial();

export const CreateDealSchema = DealSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateDealSchema = CreateDealSchema.partial();

export const CreateActivitySchema = ActivitySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export const UpdateActivitySchema = CreateActivitySchema.partial();

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  organizationName: z.string().min(2),
});

// =====================================================
// Export Types
// =====================================================

export type User = z.infer<typeof UserSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type UserStatus = z.infer<typeof UserStatusSchema>;
export type AuthToken = z.infer<typeof AuthTokenSchema>;

export type Organization = z.infer<typeof OrganizationSchema>;
export type OrganizationPlan = z.infer<typeof OrganizationPlanSchema>;
export type OrganizationStatus = z.infer<typeof OrganizationStatusSchema>;

export type Contact = z.infer<typeof ContactSchema>;
export type ContactType = z.infer<typeof ContactTypeSchema>;
export type ContactSource = z.infer<typeof ContactSourceSchema>;

export type Deal = z.infer<typeof DealSchema>;
export type DealStage = z.infer<typeof DealStageSchema>;
export type DealPriority = z.infer<typeof DealPrioritySchema>;

export type Activity = z.infer<typeof ActivitySchema>;
export type ActivityType = z.infer<typeof ActivityTypeSchema>;

export type Pagination = z.infer<typeof PaginationSchema>;
export type ApiResponse<T> = z.infer<
  ReturnType<typeof ApiResponseSchema<z.ZodType<T>>>
>;
export type ApiError = z.infer<typeof ApiErrorSchema>;

export type WebSocketEvent = z.infer<typeof WebSocketEventSchema>;

export type CreateContact = z.infer<typeof CreateContactSchema>;
export type UpdateContact = z.infer<typeof UpdateContactSchema>;
export type CreateDeal = z.infer<typeof CreateDealSchema>;
export type UpdateDeal = z.infer<typeof UpdateDealSchema>;
export type CreateActivity = z.infer<typeof CreateActivitySchema>;
export type UpdateActivity = z.infer<typeof UpdateActivitySchema>;
export type Login = z.infer<typeof LoginSchema>;
export type Register = z.infer<typeof RegisterSchema>;
