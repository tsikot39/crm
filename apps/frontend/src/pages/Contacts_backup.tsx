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

interface EditContactFormProps {
  contact: Contact;
  onSave: (contactId: string, updatedData: Partial<Contact>) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const EditContactForm: React.FC<EditContactFormProps> = ({
  contact,
  onSave,
  onCancel,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    name: contact.name,
    email: contact.email,
    company: contact.company,
    phone: contact.phone,
    status: contact.status,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(contact._id, formData);
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
          Name
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
          Email
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
          htmlFor="company"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Company
        </label>
        <input
          type="text"
          id="company"
          name="company"
          value={formData.company}
          onChange={handleChange}
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
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save
            </>
          )}
        </button>
      </div>
    </form>
  );
};

interface AddContactFormProps {
  onSave: (contactData: Omit<Contact, "_id">) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const AddContactForm: React.FC<AddContactFormProps> = ({
  onSave,
  onCancel,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    status: "active" as Contact["status"],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      lastContact: new Date().toISOString(),
    });
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
          htmlFor="add-name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Name *
        </label>
        <input
          type="text"
          id="add-name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label
          htmlFor="add-email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email *
        </label>
        <input
          type="email"
          id="add-email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label
          htmlFor="add-company"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Company
        </label>
        <input
          type="text"
          id="add-company"
          name="company"
          value={formData.company}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label
          htmlFor="add-phone"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Phone
        </label>
        <input
          type="tel"
          id="add-phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label
          htmlFor="add-status"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Status
        </label>
        <select
          id="add-status"
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
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Contact
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
        throw new Error(`HTTP ${response.status}: Failed to fetch contacts`);
      }

      const data = await response.json();

      if (data.success) {
        setContacts(data.data.contacts || []);
      } else {
        throw new Error(data.message || "Failed to fetch contacts");
      }
    } catch (err) {
      console.error("Error fetching contacts:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    try {
      const matchesSearch =
        contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || contact.status === statusFilter;

      return matchesSearch && matchesStatus;
    } catch (filterError) {
      console.error("Error filtering contact:", contact, filterError);
      return false;
    }
  });

  const getStatusBadge = (status: Contact["status"]) => {
    const statusConfig = {
      active: "bg-primary-100 text-primary-800",
      inactive: "bg-neutral-100 text-neutral-800",
      prospect: "bg-accent-100 text-accent-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsEditModalOpen(true);
  };

  const handleDeleteContact = (contactId: string) => {
    setDeleteContactId(contactId);
    setIsDeleteModalOpen(true);
  };

  const updateContact = async (
    contactId: string,
    updatedData: Partial<Contact>
  ) => {
    try {
      setIsLoading(true);
      const token = sessionStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/contacts/${contactId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to update contact`);
      }

      const data = await response.json();

      if (data.success) {
        // Update the contact in the local state
        setContacts((prev) =>
          prev.map((contact) =>
            contact._id === contactId ? { ...contact, ...updatedData } : contact
          )
        );
        setIsEditModalOpen(false);
        setEditingContact(null);
      } else {
        throw new Error(data.message || "Failed to update contact");
      }
    } catch (err) {
      console.error("Error updating contact:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteContact = async (contactId: string) => {
    try {
      setIsLoading(true);
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
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to delete contact`);
      }

      const data = await response.json();

      if (data.success) {
        // Remove the contact from the local state
        setContacts((prev) =>
          prev.filter((contact) => contact._id !== contactId)
        );
        setIsDeleteModalOpen(false);
        setDeleteContactId(null);
      } else {
        throw new Error(data.message || "Failed to delete contact");
      }
    } catch (err) {
      console.error("Error deleting contact:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const addContact = async (contactData: Omit<Contact, "_id">) => {
    try {
      setIsLoading(true);
      const token = sessionStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE_URL}/api/contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(contactData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to create contact`);
      }

      const data = await response.json();

      if (data.success) {
        // Add the new contact to the local state
        setContacts((prev) => [data.data.contact, ...prev]);
        setIsAddModalOpen(false);
        // Refresh the contacts list to get the latest data
        fetchContacts();
      } else {
        throw new Error(data.message || "Failed to create contact");
      }
    } catch (err) {
      console.error("Error creating contact:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-neutral-900">
              Contacts
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Manage your customer relationships and contact information.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white shadow-sm rounded-xl border border-neutral-200">
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
              <p className="mt-2 text-sm text-neutral-600">
                Loading contacts...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading contacts
                </h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <button
                  onClick={fetchContacts}
                  className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Table - Only show when not loading and no error */}
        {!isLoading && !error && (
          <>
            {/* Filters */}
            <div className="bg-white shadow-sm rounded-xl border border-neutral-200">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="search"
                      className="block text-sm font-medium text-neutral-700"
                    >
                      Search
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-neutral-400" />
                      </div>
                      <input
                        type="text"
                        id="search"
                        className="block w-full pl-10 border-neutral-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="Search contacts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="status"
                      className="block text-sm font-medium text-neutral-700"
                    >
                      Status
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Filter className="h-5 w-5 text-neutral-400" />
                      </div>
                      <select
                        id="status"
                        className="block w-full pl-10 border-neutral-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        value={statusFilter}
                        onChange={(e) =>
                          setStatusFilter(
                            e.target.value as
                              | "all"
                              | "active"
                              | "prospect"
                              | "inactive"
                          )
                        }
                      >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="prospect">Prospect</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      className="w-full inline-flex justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Export
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Contacts Table */}
            <div className="bg-white shadow-sm rounded-xl border border-neutral-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Last Contact
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {filteredContacts.map((contact) => (
                      <tr
                        key={contact._id}
                        className="hover:bg-neutral-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {contact.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-neutral-900">
                                {contact.name}
                              </div>
                              <div className="text-sm text-neutral-500 flex items-center">
                                <Mail className="w-3 h-3 mr-1" />
                                {contact.email}
                              </div>
                              {contact.phone && (
                                <div className="text-sm text-neutral-500 flex items-center">
                                  <Phone className="w-3 h-3 mr-1" />
                                  {contact.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-900 flex items-center">
                            <Building2 className="w-4 h-4 mr-2 text-neutral-400" />
                            {contact.company || "No company"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(contact.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {new Date(contact.lastContact).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEditContact(contact)}
                            className="text-primary-600 hover:text-primary-900 transition-colors duration-200 p-1"
                            title="Edit contact"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteContact(contact._id)}
                            className="text-red-600 hover:text-red-900 transition-colors duration-200 p-1"
                            title="Delete contact"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredContacts.length === 0 && (
                  <div className="text-center py-12">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No contacts found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm || statusFilter !== "all"
                        ? "Try adjusting your search or filter criteria."
                        : "Get started by adding your first contact."}
                    </p>
                    {!searchTerm && statusFilter === "all" && (
                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={() => setIsAddModalOpen(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          Add Contact
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Contact
              </h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingContact(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <EditContactForm
              contact={editingContact}
              onSave={updateContact}
              onCancel={() => {
                setIsEditModalOpen(false);
                setEditingContact(null);
              }}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deleteContactId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Contact
              </h3>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteContactId(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-600">
                Are you sure you want to delete this contact? This action cannot
                be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteContactId(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteContact(deleteContactId)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
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
      )}

      {/* Add Contact Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add New Contact
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <AddContactForm
              onSave={addContact}
              onCancel={() => setIsAddModalOpen(false)}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
