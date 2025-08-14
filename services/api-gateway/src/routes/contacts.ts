import { Router, Request, Response } from "express";
import { contactRepository } from "../../../../shared/database/repositories";
import { ContactDocument } from "../../../../shared/database/types";
import { AuthenticatedRequest } from "../middleware/auth";
import { asyncHandler, createApiError } from "../middleware/errorHandler";
import { z } from "zod";

const router = Router();

// Validation schemas
const createContactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  companyId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  status: z.enum(["lead", "prospect", "customer", "inactive"]).default("lead"),
});

const updateContactSchema = createContactSchema.partial();

// Get all contacts for organization
router.get(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createApiError("Authentication required", 401);
    }

    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build filter
    const filter: any = { organizationId: req.user.organizationId };

    if (status) {
      filter.status = status;
    }

    let contacts: ContactDocument[];

    if (search) {
      contacts = await contactRepository.searchByName(search as string);
      contacts = contacts.filter(
        (contact) => contact.organizationId === req.user!.organizationId
      );
    } else {
      contacts = await contactRepository.find(filter, {
        skip,
        limit: Number(limit),
        sort: { createdAt: -1 },
      });
    }

    const total = await contactRepository.count(filter);

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  })
);

// Get contact by ID
router.get(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createApiError("Authentication required", 401);
    }

    const contact = await contactRepository.findById(req.params.id);

    if (!contact) {
      throw createApiError("Contact not found", 404);
    }

    if (contact.organizationId !== req.user.organizationId) {
      throw createApiError("Access denied", 403);
    }

    res.json({
      success: true,
      data: { contact },
    });
  })
);

// Create new contact
router.post(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createApiError("Authentication required", 401);
    }

    const validatedData = createContactSchema.parse(req.body);

    // Check if contact with email already exists
    if (validatedData.email) {
      const existingContact = await contactRepository.findByEmail(
        validatedData.email
      );
      if (
        existingContact &&
        existingContact.organizationId === req.user.organizationId
      ) {
        throw createApiError("Contact with this email already exists", 409);
      }
    }

    const contactData: Omit<
      ContactDocument,
      "_id" | "createdAt" | "updatedAt"
    > = {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      phone: validatedData.phone,
      jobTitle: validatedData.jobTitle,
      companyId: validatedData.companyId,
      tags: validatedData.tags || [],
      notes: validatedData.notes,
      status: validatedData.status || "lead",
      organizationId: req.user.organizationId,
      assignedTo: req.user.id,
    };

    const contact = await contactRepository.create(contactData);

    res.status(201).json({
      success: true,
      message: "Contact created successfully",
      data: { contact },
    });
  })
);

// Update contact
router.put(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createApiError("Authentication required", 401);
    }

    const validatedData = updateContactSchema.parse(req.body);

    const existingContact = await contactRepository.findById(req.params.id);
    if (!existingContact) {
      throw createApiError("Contact not found", 404);
    }

    if (existingContact.organizationId !== req.user.organizationId) {
      throw createApiError("Access denied", 403);
    }

    const contact = await contactRepository.updateById(req.params.id, {
      $set: validatedData,
    });

    res.json({
      success: true,
      message: "Contact updated successfully",
      data: { contact },
    });
  })
);

// Delete contact
router.delete(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createApiError("Authentication required", 401);
    }

    const contact = await contactRepository.findById(req.params.id);
    if (!contact) {
      throw createApiError("Contact not found", 404);
    }

    if (contact.organizationId !== req.user.organizationId) {
      throw createApiError("Access denied", 403);
    }

    await contactRepository.deleteById(req.params.id);

    res.json({
      success: true,
      message: "Contact deleted successfully",
    });
  })
);

export { router as contactsRouter };
