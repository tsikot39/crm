import React, { useState, useEffect, useCallback } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { useAuthStore } from "../stores/authStore";

interface Deal {
  id: string;
  title: string;
  company: string;
  contactName: string;
  value: number;
  probability: number;
  stage:
    | "lead"
    | "qualified"
    | "proposal"
    | "negotiation"
    | "closed-won"
    | "closed-lost";
  expectedCloseDate: string;
  lastActivity?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface DealsResponse {
  success: boolean;
  data: {
    deals: Deal[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export const Deals: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<
    "active" | "all" | Deal["stage"]
  >("active");
  const [sortBy, setSortBy] = useState<"value" | "probability" | "closeDate">(
    "value"
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { token } = useAuthStore();

  const fetchDeals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: "50",
        ...(searchTerm && { search: searchTerm }),
        ...(stageFilter === "active" && { activeOnly: "true" }),
        ...(stageFilter !== "all" &&
          stageFilter !== "active" && { stage: stageFilter }),
      });

      const response = await fetch(
        `http://localhost:3001/api/deals?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch deals");
      }

      const data: DealsResponse = await response.json();

      if (data.success) {
        const sortedDeals = [...data.data.deals];

        // Apply client-side sorting since API doesn't handle all sort options
        sortedDeals.sort((a, b) => {
          switch (sortBy) {
            case "value":
              return b.value - a.value;
            case "probability":
              return b.probability - a.probability;
            case "closeDate":
              return (
                new Date(a.expectedCloseDate).getTime() -
                new Date(b.expectedCloseDate).getTime()
              );
            default:
              return 0;
          }
        });

        setDeals(sortedDeals);
      } else {
        throw new Error("Failed to load deals");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching deals:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token, searchTerm, stageFilter, sortBy]);

  const handleCreateDeal = async (dealData: {
    title: string;
    company: string;
    contactName: string;
    value: number;
    probability: number;
    stage: Deal["stage"];
    expectedCloseDate: string;
  }) => {
    try {
      setIsCreating(true);

      const response = await fetch("http://localhost:3001/api/deals", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dealData),
      });

      if (!response.ok) {
        throw new Error("Failed to create deal");
      }

      const result = await response.json();

      if (result.success) {
        // Refresh the deals list
        await fetchDeals();
        setShowAddModal(false);
      } else {
        throw new Error(result.message || "Failed to create deal");
      }
    } catch (error) {
      console.error("Error creating deal:", error);
      alert(error instanceof Error ? error.message : "Failed to create deal");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditDeal = async (dealData: {
    title: string;
    company: string;
    contactName: string;
    value: number;
    probability: number;
    stage: Deal["stage"];
    expectedCloseDate: string;
  }) => {
    if (!editingDeal) return;

    try {
      setIsUpdating(true);

      const response = await fetch(
        `http://localhost:3001/api/deals/${editingDeal.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dealData),
        }
      );

      console.log("Update response status:", response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Update error response:", errorData);
        throw new Error(
          `Failed to update deal: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();

      if (result.success) {
        // Refresh the deals list
        await fetchDeals();
        setShowEditModal(false);
        setEditingDeal(null);
      } else {
        throw new Error(result.message || "Failed to update deal");
      }
    } catch (error) {
      console.error("Error updating deal:", error);
      alert(error instanceof Error ? error.message : "Failed to update deal");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteDeal = async () => {
    if (!deleteId) return;

    try {
      setIsDeleting(true);

      const response = await fetch(
        `http://localhost:3001/api/deals/${deleteId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete deal");
      }

      const result = await response.json();

      if (result.success) {
        // Refresh the deals list
        await fetchDeals();
        setShowDeleteModal(false);
        setDeleteId(null);
      } else {
        throw new Error(result.message || "Failed to delete deal");
      }
    } catch (error) {
      console.error("Error deleting deal:", error);
      alert(error instanceof Error ? error.message : "Failed to delete deal");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDeals();
    }
  }, [token, fetchDeals]);

  const filteredDeals = deals;

  if (error) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">Error loading deals</div>
            <button
              onClick={() => fetchDeals()}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const getStageConfig = (stage: Deal["stage"]) => {
    const configs = {
      lead: { color: "bg-gray-100 text-gray-800", label: "Lead" },
      qualified: { color: "bg-blue-100 text-blue-800", label: "Qualified" },
      proposal: { color: "bg-yellow-100 text-yellow-800", label: "Proposal" },
      negotiation: {
        color: "bg-orange-100 text-orange-800",
        label: "Negotiation",
      },
      "closed-won": {
        color: "bg-green-100 text-green-800",
        label: "Closed Won",
      },
      "closed-lost": { color: "bg-red-100 text-red-800", label: "Closed Lost" },
    };
    return configs[stage];
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return "text-green-600";
    if (probability >= 60) return "text-yellow-600";
    if (probability >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const totalPipelineValue = filteredDeals.reduce(
    (sum, deal) => sum + deal.value,
    0
  );
  const weightedPipelineValue = filteredDeals.reduce(
    (sum, deal) => sum + (deal.value * deal.probability) / 100,
    0
  );

  // Add Deal Modal Component
  const AddDealModal = () => {
    const [formData, setFormData] = useState({
      title: "",
      company: "",
      contactName: "",
      value: "",
      probability: "50",
      stage: "lead" as Deal["stage"],
      expectedCloseDate: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!formData.title || !formData.value || !formData.expectedCloseDate) {
        alert("Please fill in all required fields");
        return;
      }

      await handleCreateDeal({
        title: formData.title,
        company: formData.company,
        contactName: formData.contactName,
        value: parseFloat(formData.value),
        probability: parseInt(formData.probability),
        stage: formData.stage,
        expectedCloseDate: formData.expectedCloseDate
          ? new Date(formData.expectedCloseDate).toISOString()
          : new Date().toISOString(),
      });
    };

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    };

    if (!showAddModal) return null;

    return (
      <div
        className="fixed inset-0 z-50 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          {/* Background overlay */}
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            aria-hidden="true"
            onClick={() => setShowAddModal(false)}
          ></div>

          {/* Modal panel */}
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3
                    className="text-lg leading-6 font-medium text-gray-900 mb-4"
                    id="modal-title"
                  >
                    Add New Deal
                  </h3>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label
                        htmlFor="title"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Deal Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        id="title"
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="Enter deal title"
                        value={formData.title}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="company"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Company
                      </label>
                      <input
                        type="text"
                        name="company"
                        id="company"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="Enter company name"
                        value={formData.company}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="contactName"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Contact Name
                      </label>
                      <input
                        type="text"
                        name="contactName"
                        id="contactName"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="Enter contact name"
                        value={formData.contactName}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="value"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Deal Value ($) *
                        </label>
                        <input
                          type="number"
                          name="value"
                          id="value"
                          required
                          min="0"
                          step="0.01"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          placeholder="0.00"
                          value={formData.value}
                          onChange={handleChange}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="probability"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Probability (%)
                        </label>
                        <input
                          type="number"
                          name="probability"
                          id="probability"
                          min="0"
                          max="100"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          value={formData.probability}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="stage"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Stage
                        </label>
                        <select
                          name="stage"
                          id="stage"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          value={formData.stage}
                          onChange={handleChange}
                        >
                          <option value="lead">Lead</option>
                          <option value="qualified">Qualified</option>
                          <option value="proposal">Proposal</option>
                          <option value="negotiation">Negotiation</option>
                          <option value="closed-won">Closed Won</option>
                          <option value="closed-lost">Closed Lost</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="expectedCloseDate"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Expected Close Date *
                        </label>
                        <input
                          type="date"
                          name="expectedCloseDate"
                          id="expectedCloseDate"
                          required
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          value={formData.expectedCloseDate}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                      <button
                        type="submit"
                        disabled={isCreating}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCreating ? "Creating..." : "Create Deal"}
                      </button>
                      <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                        onClick={() => setShowAddModal(false)}
                        disabled={isCreating}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Edit Deal Modal Component
  const EditDealModal = () => {
    const [formData, setFormData] = useState({
      title: "",
      company: "",
      contactName: "",
      value: "",
      probability: "50",
      stage: "lead" as Deal["stage"],
      expectedCloseDate: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!formData.title || !formData.value || !formData.expectedCloseDate) {
        alert("Please fill in all required fields");
        return;
      }

      await handleEditDeal({
        title: formData.title,
        company: formData.company,
        contactName: formData.contactName,
        value: parseFloat(formData.value),
        probability: parseInt(formData.probability),
        stage: formData.stage,
        expectedCloseDate: formData.expectedCloseDate
          ? new Date(formData.expectedCloseDate).toISOString()
          : new Date().toISOString(),
      });
    };

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    };

    if (!showEditModal || !editingDeal) return null;

    // Initialize form data with current deal values if not already set
    if (formData.title === "" && editingDeal) {
      setFormData({
        title: editingDeal.title || "",
        company: editingDeal.company || "",
        contactName: editingDeal.contactName || "",
        value: editingDeal.value?.toString() || "",
        probability: editingDeal.probability?.toString() || "50",
        stage: editingDeal.stage || "lead",
        expectedCloseDate: editingDeal.expectedCloseDate?.split("T")[0] || "",
      });
    }

    return (
      <div
        className="fixed inset-0 z-50 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          {/* Background overlay */}
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            aria-hidden="true"
            onClick={() => setShowEditModal(false)}
          ></div>

          {/* Modal panel */}
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3
                    className="text-lg leading-6 font-medium text-gray-900 mb-4"
                    id="modal-title"
                  >
                    Edit Deal
                  </h3>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label
                        htmlFor="edit-title"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Deal Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        id="edit-title"
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="Enter deal title"
                        value={formData.title}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="edit-company"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Company
                      </label>
                      <input
                        type="text"
                        name="company"
                        id="edit-company"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="Enter company name"
                        value={formData.company}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="edit-contactName"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Contact Name
                      </label>
                      <input
                        type="text"
                        name="contactName"
                        id="edit-contactName"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="Enter contact name"
                        value={formData.contactName}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="edit-value"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Deal Value ($) *
                        </label>
                        <input
                          type="number"
                          name="value"
                          id="edit-value"
                          required
                          min="0"
                          step="0.01"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          placeholder="0.00"
                          value={formData.value}
                          onChange={handleChange}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="edit-probability"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Probability (%)
                        </label>
                        <input
                          type="number"
                          name="probability"
                          id="edit-probability"
                          min="0"
                          max="100"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          value={formData.probability}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="edit-stage"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Stage
                        </label>
                        <select
                          name="stage"
                          id="edit-stage"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          value={formData.stage}
                          onChange={handleChange}
                        >
                          <option value="lead">Lead</option>
                          <option value="qualified">Qualified</option>
                          <option value="proposal">Proposal</option>
                          <option value="negotiation">Negotiation</option>
                          <option value="closed-won">Closed Won</option>
                          <option value="closed-lost">Closed Lost</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="edit-expectedCloseDate"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Expected Close Date *
                        </label>
                        <input
                          type="date"
                          name="expectedCloseDate"
                          id="edit-expectedCloseDate"
                          required
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          value={formData.expectedCloseDate}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                      <button
                        type="submit"
                        disabled={isUpdating}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUpdating ? "Updating..." : "Update Deal"}
                      </button>
                      <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                        onClick={() => {
                          setShowEditModal(false);
                          setEditingDeal(null);
                        }}
                        disabled={isUpdating}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Delete Deal Modal Component
  const DeleteDealModal = () => {
    if (!showDeleteModal) return null;

    const dealToDelete = deals.find((deal) => deal.id === deleteId);

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={() => setShowDeleteModal(false)}
        ></div>

        {/* Modal panel */}
        <div className="relative bg-white rounded-lg shadow-xl transform transition-all max-w-lg w-full mx-4">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3
                  className="text-lg leading-6 font-medium text-gray-900"
                  id="modal-title"
                >
                  Delete Deal
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete "{dealToDelete?.title}"?
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDeleteDeal}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteId(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Deals Pipeline
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Track and manage your sales opportunities and revenue pipeline.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Add Deal
            </button>
          </div>
        </div>

        {/* Pipeline Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Pipeline Value
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {isLoading ? "..." : formatCurrency(totalPipelineValue)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Weighted Pipeline Value
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {isLoading
                        ? "..."
                        : formatCurrency(weightedPipelineValue)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stageFilter === "active"
                        ? "Active Deals"
                        : stageFilter === "all"
                        ? "Total Deals"
                        : `${
                            stageFilter.charAt(0).toUpperCase() +
                            stageFilter.slice(1).replace("-", " ")
                          } Deals`}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {isLoading ? "..." : filteredDeals.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label
                  htmlFor="search"
                  className="block text-sm font-medium text-gray-700"
                >
                  Search
                </label>
                <input
                  type="text"
                  id="search"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Search deals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="stage"
                  className="block text-sm font-medium text-gray-700"
                >
                  Stage
                </label>
                <select
                  id="stage"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={stageFilter}
                  onChange={(e) =>
                    setStageFilter(e.target.value as typeof stageFilter)
                  }
                >
                  <option value="active">Active Deals</option>
                  <option value="all">All Deals</option>
                  <option value="lead">Lead</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="closed-won">Closed Won</option>
                  <option value="closed-lost">Closed Lost</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="sort"
                  className="block text-sm font-medium text-gray-700"
                >
                  Sort By
                </label>
                <select
                  id="sort"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                >
                  <option value="value">Deal Value</option>
                  <option value="probability">Probability</option>
                  <option value="closeDate">Close Date</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  className="w-full inline-flex justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Deals Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-neutral-600">Loading deals...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company & Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Probability
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Close Date
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDeals.map((deal) => {
                    return (
                      <tr key={deal.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {deal.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              Last activity:{" "}
                              {deal.updatedAt
                                ? new Date(deal.updatedAt).toLocaleDateString()
                                : "N/A"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {deal.company || "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {deal.contactName || "No contact"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(deal.value)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              getStageConfig(deal.stage).color
                            }`}
                          >
                            {getStageConfig(deal.stage).label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-sm font-medium ${getProbabilityColor(
                              deal.probability
                            )}`}
                          >
                            {deal.probability}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(
                            deal.expectedCloseDate
                          ).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => {
                                setEditingDeal(deal);
                                setShowEditModal(true);
                              }}
                              className="text-primary-600 hover:text-primary-900 p-2 hover:bg-primary-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteId(deal.id);
                                setShowDeleteModal(true);
                              }}
                              className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredDeals.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No deals found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {(() => {
                  if (error)
                    return "There was an error loading deals. Please try again.";
                  if (
                    searchTerm ||
                    (stageFilter !== "all" && stageFilter !== "active")
                  )
                    return "Try adjusting your search or filter criteria.";
                  return "Get started by adding your first deal.";
                })()}
              </p>
              {!searchTerm &&
                (stageFilter === "all" || stageFilter === "active") && (
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Add Deal
                    </button>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Add Deal Modal */}
      <AddDealModal />

      {/* Edit Deal Modal */}
      <EditDealModal />

      {/* Delete Deal Modal */}
      <DeleteDealModal />
    </DashboardLayout>
  );
};

export default Deals;
