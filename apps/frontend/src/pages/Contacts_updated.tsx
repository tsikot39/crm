import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Building2,
  Loader2,
  Edit2,
  Trash2,
  X,
  Save,
  User,
} from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";

interface Contact {
  _id: string;
  name: string;
  email: string;
  company: string;
  companyId: string | null;
  jobTitle: string;
  phone: string;
  status: "active" | "inactive" | "prospect";
  lastContact: string;
}

interface Company {
  id: string;
  name: string;
  industry: string;
  website: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface ContactFormProps {
  contact?: Contact;
  companies: Company[];
  onSave: (contactData: any) => void;
  onCancel: () => void;
  isLoading: boolean;
  isEdit?: boolean;
}

const ContactForm: React.FC<ContactFormProps> = ({
  contact,
  companies,
  onSave,
  onCancel,
  isLoading,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState({
    name: contact?.name || "",
    email: contact?.email || "",
    companyId: contact?.companyId || "",
    jobTitle: contact?.jobTitle || "",
    phone: contact?.phone || "",
    status: (contact?.status || "active") as Contact["status"],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedCompany = companies.find((c) => c.id === formData.companyId);
    const contactData = {
      ...formData,
      company: selectedCompany ? selectedCompany.name : "No company",
      companyId: formData.companyId || null,
      lastContact: new Date().toISOString(),
    };

    if (isEdit && contact) {
      onSave({
        ...contact,
        ...contactData,
      });
    } else {
      onSave(contactData);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label
          htmlFor="companyId"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Company
        </label>
        <select
          id="companyId"
          name="companyId"
          value={formData.companyId}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">No company (Individual contact)</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name} {company.industry && `(${company.industry})`}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="jobTitle"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Job Title
        </label>
        <input
          type="text"
          id="jobTitle"
          name="jobTitle"
          value={formData.jobTitle}
          onChange={handleChange}
          placeholder="e.g. CEO, Sales Manager, Developer"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Phone
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label
          htmlFor="status"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Status
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="prospect">Prospect</option>
        </select>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors flex items-center"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isEdit ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isEdit ? "Update Contact" : "Create Contact"}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export const Contacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Contact["status"]>(
    "all"
  );
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteContactId, setDeleteContactId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchContacts();
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const token = sessionStorage.getItem("auth_token");
      if (!token) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/companies/list`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCompanies(data.data.companies || []);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = sessionStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE_URL}/api/contacts`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setContacts(data.data.contacts || []);
      } else {
        throw new Error(data.message || "Failed to fetch contacts");
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch contacts"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContact = async (contactData: Omit<Contact, "_id">) => {
    try {
      setIsSubmitting(true);
      const token = sessionStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE_URL}/api/contacts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contactData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        await fetchContacts(); // Refresh the list
        setIsAddModalOpen(false);
      } else {
        throw new Error(data.message || "Failed to create contact");
      }
    } catch (error) {
      console.error("Error creating contact:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create contact"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateContact = async (updatedContact: Contact) => {
    try {
      setIsSubmitting(true);
      const token = sessionStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/contacts/${updatedContact._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedContact),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        await fetchContacts(); // Refresh the list
        setIsEditModalOpen(false);
        setEditingContact(null);
      } else {
        throw new Error(data.message || "Failed to update contact");
      }
    } catch (error) {
      console.error("Error updating contact:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update contact"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      setIsSubmitting(true);
      const token = sessionStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/contacts/${contactId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        await fetchContacts(); // Refresh the list
        setIsDeleteModalOpen(false);
        setDeleteContactId(null);
      } else {
        throw new Error(data.message || "Failed to delete contact");
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete contact"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.jobTitle &&
        contact.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || contact.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Contact["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "prospect":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold text-neutral-900">
              Contacts
            </h1>
            <p className="text-neutral-600 mt-1">
              Manage your contacts and their company relationships
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Contact</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search contacts by name, email, company, or job title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | Contact["status"])
              }
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="prospect">Prospect</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <>
            {/* Contacts List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Contact
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredContacts.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          {searchTerm || statusFilter !== "all"
                            ? "No contacts match your search criteria"
                            : "No contacts found. Add your first contact to get started."}
                        </td>
                      </tr>
                    ) : (
                      filteredContacts.map((contact) => (
                        <tr key={contact._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                  <User className="h-5 w-5 text-primary-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {contact.name}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {contact.email}
                                </div>
                                {contact.phone && (
                                  <div className="text-sm text-gray-500 flex items-center">
                                    <Phone className="h-3 w-3 mr-1" />
                                    {contact.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                              {contact.company || "No company"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {contact.jobTitle || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                contact.status
                              )}`}
                            >
                              {contact.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(contact.lastContact).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => {
                                  setEditingContact(contact);
                                  setIsEditModalOpen(true);
                                }}
                                className="text-primary-600 hover:text-primary-900 p-2 hover:bg-primary-50 rounded-lg transition-colors"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteContactId(contact._id);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Add Contact Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Add New Contact
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6">
                <ContactForm
                  companies={companies}
                  onSave={handleAddContact}
                  onCancel={() => setIsAddModalOpen(false)}
                  isLoading={isSubmitting}
                />
              </div>
            </div>
          </div>
        )}

        {/* Edit Contact Modal */}
        {isEditModalOpen && editingContact && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Edit Contact
                </h3>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingContact(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6">
                <ContactForm
                  contact={editingContact}
                  companies={companies}
                  onSave={handleUpdateContact}
                  onCancel={() => {
                    setIsEditModalOpen(false);
                    setEditingContact(null);
                  }}
                  isLoading={isSubmitting}
                  isEdit={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && deleteContactId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Delete Contact
                </h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this contact? This action
                  cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setDeleteContactId(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteContact(deleteContactId)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
