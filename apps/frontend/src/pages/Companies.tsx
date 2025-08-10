import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import {
  Building2,
  Search,
  Plus,
  Globe,
  MapPin,
  Users,
  TrendingUp,
  Eye,
  Edit2,
  Trash2,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";

interface Company {
  id: string;
  name: string;
  website: string;
  industry: string;
  size: "startup" | "small" | "medium" | "large" | "enterprise";
  revenue: number;
  location: string;
  primaryContact: string;
  contactCount: number;
  dealCount: number;
  lastActivity: string;
  status: "active" | "inactive" | "prospect";
  createdAt: string;
  updatedAt: string;
}

interface CompaniesResponse {
  success: boolean;
  data: {
    companies: Company[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

interface EditCompanyModalProps {
  company: Company;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (data: Partial<Company>) => Promise<void>;
  isUpdating: boolean;
}

interface DeleteConfirmationModalProps {
  company: Company;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (
    data: Omit<
      Company,
      | "id"
      | "contactCount"
      | "dealCount"
      | "lastActivity"
      | "createdAt"
      | "updatedAt"
    >
  ) => Promise<void>;
  isCreating: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  company,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">
              Delete Company
            </h3>
            <p className="text-sm text-gray-500">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-700">
            Are you sure you want to delete{" "}
            <span className="font-medium">{company.name}</span>?
          </p>
          {company.contactCount > 0 && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    This company has {company.contactCount} associated contact
                    {company.contactCount > 1 ? "s" : ""}. You may need to
                    reassign or delete the contacts first.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Deleting..." : "Delete Company"}
          </button>
        </div>
      </div>
    </div>
  );
};

const AddCompanyModal: React.FC<AddCompanyModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  isCreating,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    website: "",
    industry: "",
    size: "small" as Company["size"],
    revenue: 0,
    location: "",
    primaryContact: "",
    status: "prospect" as Company["status"],
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setErrors({});

    // Validate required fields
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) {
      newErrors.name = "Company name is required";
    }
    if (!formData.industry.trim()) {
      newErrors.industry = "Industry is required";
    }
    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onCreate(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "revenue" ? Number(value) : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      website: "",
      industry: "",
      size: "small",
      revenue: 0,
      location: "",
      primaryContact: "",
      status: "prospect",
    });
    setErrors({});
  };

  const handleClose = () => {
    if (!isCreating) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Add New Company
          </h2>
          <button
            onClick={handleClose}
            disabled={isCreating}
            className="text-gray-400 hover:text-gray-600 focus:outline-none disabled:opacity-50"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="add-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Company Name *
            </label>
            <input
              type="text"
              id="add-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isCreating}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.name ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Enter company name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="add-website"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Website
            </label>
            <input
              type="url"
              id="add-website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              disabled={isCreating}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label
              htmlFor="add-industry"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Industry *
            </label>
            <input
              type="text"
              id="add-industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              disabled={isCreating}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.industry ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="e.g., Technology, Healthcare, Finance"
            />
            {errors.industry && (
              <p className="mt-1 text-sm text-red-600">{errors.industry}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="add-size"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Company Size *
            </label>
            <select
              id="add-size"
              name="size"
              value={formData.size}
              onChange={handleChange}
              disabled={isCreating}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="startup">Startup</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="add-revenue"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Annual Revenue ($)
            </label>
            <input
              type="number"
              id="add-revenue"
              name="revenue"
              value={formData.revenue}
              onChange={handleChange}
              min="0"
              disabled={isCreating}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="0"
            />
          </div>

          <div>
            <label
              htmlFor="add-location"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Location *
            </label>
            <input
              type="text"
              id="add-location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              disabled={isCreating}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.location ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="City, State/Country"
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="add-primaryContact"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Primary Contact
            </label>
            <input
              type="text"
              id="add-primaryContact"
              name="primaryContact"
              value={formData.primaryContact}
              onChange={handleChange}
              disabled={isCreating}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Contact person name"
            />
          </div>

          <div>
            <label
              htmlFor="add-status"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Status *
            </label>
            <select
              id="add-status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={isCreating}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="prospect">Prospect</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? "Creating..." : "Create Company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ViewCompanyModalProps {
  company: Company;
  isOpen: boolean;
  onClose: () => void;
}

const ViewCompanyModal: React.FC<ViewCompanyModalProps> = ({
  company,
  isOpen,
  onClose,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSizeLabel = (size: string) => {
    const labels = {
      startup: "Startup",
      small: "Small",
      medium: "Medium",
      large: "Large",
      enterprise: "Enterprise",
    };
    return labels[size as keyof typeof labels] || size;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Company Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Company Header */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-xl font-medium text-gray-900">
              {company.name}
            </h3>
            <div className="mt-2 flex items-center space-x-4">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  company.status === "active"
                    ? "bg-green-100 text-green-800"
                    : company.status === "prospect"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {company.status}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  company.size === "enterprise"
                    ? "bg-purple-100 text-purple-800"
                    : company.size === "large"
                    ? "bg-indigo-100 text-indigo-800"
                    : company.size === "medium"
                    ? "bg-blue-100 text-blue-800"
                    : company.size === "small"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {getSizeLabel(company.size)}
              </span>
            </div>
          </div>

          {/* Company Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Website
                </label>
                <div className="text-gray-900">
                  {company.website ? (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-800 hover:underline"
                    >
                      {company.website}
                    </a>
                  ) : (
                    <span className="text-gray-400">Not provided</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Industry
                </label>
                <div className="text-gray-900">{company.industry}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Location
                </label>
                <div className="text-gray-900">{company.location}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Primary Contact
                </label>
                <div className="text-gray-900">
                  {company.primaryContact || (
                    <span className="text-gray-400">Not assigned</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Annual Revenue
                </label>
                <div className="text-gray-900 text-lg font-medium">
                  {formatCurrency(company.revenue)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Total Contacts
                </label>
                <div className="text-gray-900 text-lg font-medium">
                  {company.contactCount}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Active Deals
                </label>
                <div className="text-gray-900 text-lg font-medium">
                  {company.dealCount}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Last Activity
                </label>
                <div className="text-gray-900">
                  {company.lastActivity
                    ? formatDate(company.lastActivity)
                    : "No recent activity"}
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <span className="font-medium">Created:</span>{" "}
                {formatDate(company.createdAt)}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span>{" "}
                {formatDate(company.updatedAt)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface EditCompanyModalProps {
  company: Company;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (data: Partial<Company>) => Promise<void>;
  isUpdating: boolean;
}

const EditCompanyModal: React.FC<EditCompanyModalProps> = ({
  company,
  isOpen,
  onClose,
  onUpdate,
  isUpdating,
}) => {
  const [formData, setFormData] = useState({
    name: company.name,
    website: company.website,
    industry: company.industry,
    size: company.size,
    revenue: company.revenue,
    location: company.location,
    primaryContact: company.primaryContact,
    status: company.status,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "revenue" ? Number(value) : value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Edit Company</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Company Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label
              htmlFor="website"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Website
            </label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label
              htmlFor="industry"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Industry *
            </label>
            <input
              type="text"
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label
              htmlFor="size"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Company Size *
            </label>
            <select
              id="size"
              name="size"
              value={formData.size}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="startup">Startup</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="revenue"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Annual Revenue ($)
            </label>
            <input
              type="number"
              id="revenue"
              name="revenue"
              value={formData.revenue}
              onChange={handleChange}
              min="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Location *
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="City, State/Country"
            />
          </div>

          <div>
            <label
              htmlFor="primaryContact"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Primary Contact
            </label>
            <input
              type="text"
              id="primaryContact"
              name="primaryContact"
              value={formData.primaryContact}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Status *
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="prospect">Prospect</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? "Updating..." : "Update Company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const Companies: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showOnlyHighlighted, setShowOnlyHighlighted] = useState(false);
  const [highlightedCompanyId, setHighlightedCompanyId] = useState<
    string | null
  >(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const { token } = useAuthStore();

  // Handle URL parameters on component mount
  useEffect(() => {
    const highlight = searchParams.get("highlight");
    if (highlight) {
      setHighlightedCompanyId(highlight);
      setShowOnlyHighlighted(true); // Show only this company

      // Remove the highlight parameter from URL after processing
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("highlight");
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Clear the filter when user starts typing in search
  useEffect(() => {
    if (showOnlyHighlighted && (searchTerm || statusFilter || industryFilter)) {
      setShowOnlyHighlighted(false);
      setHighlightedCompanyId(null);
    }
  }, [searchTerm, statusFilter, industryFilter, showOnlyHighlighted]);

  const fetchCompanies = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(industryFilter && { industry: industryFilter }),
      });

      const response = await fetch(
        `http://localhost:3001/api/companies?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch companies");
      }

      const data: CompaniesResponse = await response.json();

      if (data.success) {
        setCompanies(data.data.companies);
        setTotalPages(data.data.pagination.pages);
        setTotalCompanies(data.data.pagination.total);
      } else {
        throw new Error("Failed to load companies");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching companies:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token, currentPage, searchTerm, statusFilter, industryFilter]);

  useEffect(() => {
    if (token) {
      fetchCompanies();
    }
  }, [token, fetchCompanies]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSizeLabel = (size: string) => {
    const labels = {
      startup: "Startup",
      small: "Small",
      medium: "Medium",
      large: "Large",
      enterprise: "Enterprise",
    };
    return labels[size as keyof typeof labels] || size;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "prospect":
        return "bg-blue-100 text-blue-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSizeColor = (size: string) => {
    switch (size) {
      case "enterprise":
        return "bg-purple-100 text-purple-800";
      case "large":
        return "bg-indigo-100 text-indigo-800";
      case "medium":
        return "bg-blue-100 text-blue-800";
      case "small":
        return "bg-green-100 text-green-800";
      case "startup":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditingCompany(null);
    setIsEditModalOpen(false);
  };

  const handleUpdateCompany = async (updatedData: Partial<Company>) => {
    if (!editingCompany || !token) return;

    try {
      setIsUpdating(true);

      const response = await fetch(
        `http://localhost:3001/api/companies/${editingCompany.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedData),
        }
      );

      const result = await response.json();

      if (result.success) {
        // Update the company in the local state
        setCompanies(
          companies.map((company) =>
            company.id === editingCompany.id
              ? { ...company, ...updatedData }
              : company
          )
        );

        // Close the modal
        handleCloseEditModal();

        // Optionally refresh the data to ensure consistency
        await fetchCompanies();
      } else {
        setError(result.message || "Failed to update company");
      }
    } catch (error) {
      console.error("Error updating company:", error);
      setError("Failed to update company");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleViewCompany = (company: Company) => {
    setViewingCompany(company);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setViewingCompany(null);
    setIsViewModalOpen(false);
  };

  const handleDeleteCompany = (company: Company) => {
    setDeletingCompany(company);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setDeletingCompany(null);
    setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCompany || !token) return;

    try {
      setIsDeleting(true);

      const response = await fetch(
        `http://localhost:3001/api/companies/${deletingCompany.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        // Remove the company from the local state
        setCompanies(
          companies.filter((company) => company.id !== deletingCompany.id)
        );

        // Update total companies count
        setTotalCompanies((prev) => prev - 1);

        // Close the modal
        handleCloseDeleteModal();

        // Optionally refresh the data to ensure consistency
        await fetchCompanies();
      } else {
        setError(result.message || "Failed to delete company");
      }
    } catch (error) {
      console.error("Error deleting company:", error);
      setError("Failed to delete company");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddCompany = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleCreateCompany = async (
    companyData: Omit<
      Company,
      | "id"
      | "contactCount"
      | "dealCount"
      | "lastActivity"
      | "createdAt"
      | "updatedAt"
    >
  ) => {
    if (!token) return;

    try {
      setIsCreating(true);

      const response = await fetch("http://localhost:3001/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(companyData),
      });

      const result = await response.json();

      if (result.success) {
        // Add the new company to the local state
        setCompanies((prevCompanies) => [
          result.data.company,
          ...prevCompanies,
        ]);

        // Update total companies count
        setTotalCompanies((prev) => prev + 1);

        // Close the modal
        handleCloseAddModal();

        // Optionally refresh the data to ensure consistency
        await fetchCompanies();
      } else {
        setError(result.message || "Failed to create company");
      }
    } catch (error) {
      console.error("Error creating company:", error);
      setError("Failed to create company");
    } finally {
      setIsCreating(false);
    }
  };

  // Get unique industries for filter
  const uniqueIndustries = Array.from(
    new Set(companies.map((c) => c.industry))
  ).filter(Boolean);

  if (error) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">
              Error loading companies
            </div>
            <button
              onClick={() => fetchCompanies()}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-neutral-900">
              Companies
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              Manage your client companies and business relationships.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={handleAddCompany}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Company
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-neutral-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Building2 className="h-6 w-6 text-neutral-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-neutral-500 truncate">
                      Total Companies
                    </dt>
                    <dd className="text-lg font-medium text-neutral-900">
                      {isLoading ? "..." : totalCompanies}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-neutral-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-neutral-500 truncate">
                      Active Companies
                    </dt>
                    <dd className="text-lg font-medium text-neutral-900">
                      {isLoading
                        ? "..."
                        : companies.filter((c) => c.status === "active").length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-neutral-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-neutral-500 truncate">
                      Total Contacts
                    </dt>
                    <dd className="text-lg font-medium text-neutral-900">
                      {isLoading
                        ? "..."
                        : companies.reduce(
                            (acc, company) => acc + company.contactCount,
                            0
                          )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-neutral-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-primary-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-neutral-500 truncate">
                      Total Revenue
                    </dt>
                    <dd className="text-lg font-medium text-neutral-900">
                      {isLoading
                        ? "..."
                        : formatCurrency(
                            companies.reduce(
                              (acc, company) => acc + company.revenue,
                              0
                            )
                          )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow-sm rounded-xl border border-neutral-200">
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="search" className="sr-only">
                  Search companies
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-neutral-400" />
                  </div>
                  <input
                    id="search"
                    name="search"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg leading-5 bg-white placeholder-neutral-500 focus:outline-none focus:placeholder-neutral-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Search companies..."
                  />
                </div>
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-900 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="prospect">Prospect</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <select
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-900 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">All Industries</option>
                  {uniqueIndustries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("");
                    setIndustryFilter("");
                  }}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-neutral-300 rounded-lg shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Companies Table */}
        <div className="bg-white shadow-sm rounded-xl border border-neutral-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h3 className="text-lg font-medium text-neutral-900">Companies</h3>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-neutral-600">Loading companies...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Industry
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {companies
                    .filter((company) =>
                      showOnlyHighlighted
                        ? company.id === highlightedCompanyId
                        : true
                    )
                    .map((company) => (
                      <tr key={company.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-primary-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-neutral-900">
                                {company.name}
                              </div>
                              {company.website && (
                                <div className="text-sm text-neutral-500 flex items-center">
                                  <Globe className="h-3 w-3 mr-1" />
                                  <a
                                    href={company.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-primary-600"
                                  >
                                    {company.website.replace(
                                      /^https?:\/\//,
                                      ""
                                    )}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                          {company.industry || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSizeColor(
                              company.size
                            )}`}
                          >
                            {getSizeLabel(company.size)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                          {formatCurrency(company.revenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {company.location || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              company.status
                            )}`}
                          >
                            {company.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            className="text-primary-600 hover:text-primary-900"
                            onClick={() => handleViewCompany(company)}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="text-neutral-600 hover:text-neutral-900"
                            onClick={() => handleEditCompany(company)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteCompany(company)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && companies.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-neutral-400" />
              <h3 className="mt-2 text-sm font-medium text-neutral-900">
                No companies found
              </h3>
              <p className="mt-1 text-sm text-neutral-500">
                Get started by creating a new company.
              </p>
              <div className="mt-6">
                <button
                  onClick={handleAddCompany}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Company
                </button>
              </div>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-neutral-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-lg text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-lg text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-neutral-700">
                    Showing{" "}
                    <span className="font-medium">
                      {(currentPage - 1) * 10 + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(currentPage * 10, totalCompanies)}
                    </span>{" "}
                    of <span className="font-medium">{totalCompanies}</span>{" "}
                    results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-lg border border-neutral-300 bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    {Array.from(
                      { length: Math.min(totalPages, 5) },
                      (_, i) => i + 1
                    ).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? "z-10 bg-primary-50 border-primary-500 text-primary-600"
                            : "bg-white border-neutral-300 text-neutral-500 hover:bg-neutral-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-lg border border-neutral-300 bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deletingCompany && (
        <DeleteConfirmationModal
          company={deletingCompany}
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
        />
      )}

      {/* View Company Modal */}
      {isViewModalOpen && viewingCompany && (
        <ViewCompanyModal
          company={viewingCompany}
          isOpen={isViewModalOpen}
          onClose={handleCloseViewModal}
        />
      )}

      {/* Add Company Modal */}
      <AddCompanyModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onCreate={handleCreateCompany}
        isCreating={isCreating}
      />

      {/* Edit Company Modal */}
      {isEditModalOpen && editingCompany && (
        <EditCompanyModal
          company={editingCompany}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onUpdate={handleUpdateCompany}
          isUpdating={isUpdating}
        />
      )}
    </DashboardLayout>
  );
};
