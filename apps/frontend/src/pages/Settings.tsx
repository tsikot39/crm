import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { useAuthStore } from "../stores/authStore";
import {
  User,
  Building,
  Shield,
  Key,
  Save,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  organization: string;
  createdAt: string;
}

interface OrganizationSettings {
  _id: string;
  name: string;
  industry: string;
  size: string;
  timezone: string;
  currency: string;
}

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [organizationSettings, setOrganizationSettings] =
    useState<OrganizationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [hasProfileChanges, setHasProfileChanges] = useState(false);
  const [hasOrgChanges, setHasOrgChanges] = useState(false);
  const {
    user,
    updateUser,
    organization,
    updateOrganization: updateOrgInStore,
    token,
  } = useAuthStore();

  const fetchUserProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // For now, use the user data from auth store since API endpoints don't exist yet
      if (user) {
        setUserProfile({
          _id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          organization: user.organizationId || "",
          createdAt: user.createdAt
            ? typeof user.createdAt === "string"
              ? user.createdAt
              : user.createdAt.toISOString()
            : new Date().toISOString(),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching user profile:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchOrganizationSettings = useCallback(async () => {
    try {
      // Use organization data from auth store, or create default if none exists
      if (organization) {
        setOrganizationSettings({
          _id: organization.id,
          name: organization.name,
          industry: organization.settings?.industry || "technology",
          size: "",
          timezone: organization.settings?.timezone || "UTC",
          currency: organization.settings?.currency || "USD",
        });
      } else if (user?.organizationId) {
        // Create a default organization in auth store and local state
        const defaultOrg = {
          id: user.organizationId,
          name: user.organizationId || "My Organization",
          slug: user.organizationId.toLowerCase(),
          plan: "free",
          settings: {
            currency: "USD",
            timezone: "UTC",
            dateFormat: "MM/DD/YYYY",
            industry: "technology",
            features: [],
          },
        };

        // Set it in the auth store
        updateOrgInStore(defaultOrg);

        // Set local state
        setOrganizationSettings({
          _id: defaultOrg.id,
          name: defaultOrg.name,
          industry: defaultOrg.settings.industry,
          size: "",
          timezone: defaultOrg.settings.timezone,
          currency: defaultOrg.settings.currency,
        });
      }
    } catch (err) {
      console.error("Error fetching organization settings:", err);
    }
  }, [user, organization, updateOrgInStore]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchOrganizationSettings();
    }
  }, [user, fetchUserProfile, fetchOrganizationSettings]);

  const checkForProfileChanges = (updatedProfile: UserProfile) => {
    if (!user) return false;

    const originalName = `${user.firstName} ${user.lastName}`;
    const hasNameChanged = updatedProfile.name !== originalName;
    const hasEmailChanged = updatedProfile.email !== user.email;

    const changes = hasNameChanged || hasEmailChanged;
    setHasProfileChanges(changes);
    return changes;
  };

  const handleProfileInputChange = (
    field: keyof UserProfile,
    value: string
  ) => {
    if (!userProfile) return;

    const updatedProfile = { ...userProfile, [field]: value };
    setUserProfile(updatedProfile);
    checkForProfileChanges(updatedProfile);
  };

  const getSaveButtonText = () => {
    if (isSaving) return "Saving...";
    if (hasProfileChanges) return "Save Changes";
    return "No Changes";
  };

  const checkForOrgChanges = (updatedOrg: OrganizationSettings) => {
    if (!organizationSettings) return false;

    const hasNameChanged = updatedOrg.name !== organizationSettings.name;
    const hasIndustryChanged =
      updatedOrg.industry !== organizationSettings.industry;

    const changes = hasNameChanged || hasIndustryChanged;
    setHasOrgChanges(changes);
    return changes;
  };

  const handleOrgInputChange = (
    field: keyof OrganizationSettings,
    value: string
  ) => {
    if (!organizationSettings) return;

    const updatedOrg = { ...organizationSettings, [field]: value };
    setOrganizationSettings(updatedOrg);
    checkForOrgChanges(updatedOrg);
  };

  const getOrgSaveButtonText = () => {
    if (isSaving) return "Saving...";
    if (hasOrgChanges) return "Save Changes";
    return "No Changes";
  };

  const updateOrganization = async (orgData: Partial<OrganizationSettings>) => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      // Basic validation
      if (!orgData.name?.trim()) {
        throw new Error("Organization name is required");
      }

      // Simulate API delay for realistic UX
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update the auth store with new organization data
      if (organization) {
        updateOrgInStore({
          name: orgData.name.trim(),
          settings: {
            ...organization.settings,
            industry: orgData.industry || "",
          },
        });
      }

      // Update the organization settings state
      const updatedOrgSettings: OrganizationSettings = {
        ...organizationSettings!,
        name: orgData.name.trim(),
        industry: orgData.industry || "",
      };

      setOrganizationSettings(updatedOrgSettings);
      setHasOrgChanges(false); // Reset changes state after successful save
      setSuccessMessage("Organization settings updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update organization settings"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      // Basic validation
      if (!profileData.name?.trim()) {
        throw new Error("Name is required");
      }

      if (!profileData.email?.trim()) {
        throw new Error("Email is required");
      }

      // Email validation regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileData.email)) {
        throw new Error("Please enter a valid email address");
      }

      // Parse the full name to get firstName and lastName
      const nameParts = profileData.name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // Call the backend API to update profile
      const response = await fetch("http://localhost:3001/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email: profileData.email.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update profile");
      }

      // Update the auth store with the updated user data from the server
      updateUser({
        firstName: result.data.user.firstName,
        lastName: result.data.user.lastName,
        email: result.data.user.email,
      });

      // Update the user profile state with new data
      const updatedUserProfile: UserProfile = {
        ...userProfile!,
        name: `${result.data.user.firstName} ${result.data.user.lastName}`,
        email: result.data.user.email,
      };

      setUserProfile(updatedUserProfile);
      setHasProfileChanges(false); // Reset changes state after successful save
      setSuccessMessage("Profile updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError("New password must be at least 6 characters long");
      return;
    }

    if (!passwordForm.currentPassword) {
      setError("Current password is required");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      // Simulate API delay for realistic UX
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Validate current password with backend
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${useAuthStore.getState().token}`,
          },
          body: JSON.stringify({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to change password");
      }

      // Reset the form after successful change
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setSuccessMessage("Password changed successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to change password"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "profile", name: "Profile", icon: User },
    { id: "organization", name: "Organization", icon: Building },
    { id: "security", name: "Security", icon: Shield },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="text-neutral-600">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your account settings and preferences.
          </p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <Check className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {successMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="sm:flex">
            {/* Sidebar */}
            <div className="sm:w-1/4 bg-gray-50 rounded-l-lg">
              <nav className="space-y-1 p-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === tab.id
                        ? "bg-primary-100 text-primary-700 border border-primary-200"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <tab.icon className="mr-3 h-5 w-5" />
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Main Content */}
            <div className="sm:w-3/4 p-6">
              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Profile Information
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Update your personal information and contact details.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="profile-name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Full Name
                      </label>
                      <input
                        id="profile-name"
                        type="text"
                        value={userProfile?.name || ""}
                        onChange={(e) =>
                          handleProfileInputChange("name", e.target.value)
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="profile-email"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Email Address
                      </label>
                      <input
                        id="profile-email"
                        type="email"
                        value={userProfile?.email || ""}
                        onChange={(e) =>
                          handleProfileInputChange("email", e.target.value)
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="profile-member-since"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Member Since
                      </label>
                      <input
                        id="profile-member-since"
                        type="text"
                        value={
                          userProfile
                            ? new Date(
                                userProfile.createdAt
                              ).toLocaleDateString()
                            : ""
                        }
                        disabled
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm px-3 py-2 border"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() =>
                        userProfile &&
                        updateProfile({
                          name: userProfile.name,
                          email: userProfile.email,
                        })
                      }
                      disabled={isSaving || !hasProfileChanges || !userProfile}
                      className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                        hasProfileChanges && !isSaving
                          ? "bg-primary-600 hover:bg-primary-700"
                          : "bg-gray-400"
                      }`}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {getSaveButtonText()}
                    </button>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === "security" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Change Password
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Update your password to keep your account secure.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="current-password"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Current Password
                      </label>
                      <div className="mt-1 relative">
                        <input
                          id="current-password"
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm((prev) => ({
                              ...prev,
                              currentPassword: e.target.value,
                            }))
                          }
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border pr-10"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="new-password"
                        className="block text-sm font-medium text-gray-700"
                      >
                        New Password
                      </label>
                      <div className="mt-1 relative">
                        <input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm((prev) => ({
                              ...prev,
                              newPassword: e.target.value,
                            }))
                          }
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="confirm-password"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Confirm New Password
                      </label>
                      <input
                        id="confirm-password"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            confirmPassword: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={changePassword}
                      disabled={
                        isSaving ||
                        !passwordForm.currentPassword ||
                        !passwordForm.newPassword ||
                        !passwordForm.confirmPassword
                      }
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Key className="mr-2 h-4 w-4" />
                      {isSaving ? "Changing..." : "Change Password"}
                    </button>
                  </div>
                </div>
              )}

              {/* Organization Tab */}
              {activeTab === "organization" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Organization Settings
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Configure your organization's information and preferences.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="org-name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Organization Name
                      </label>
                      <input
                        id="org-name"
                        type="text"
                        value={organizationSettings?.name || ""}
                        onChange={(e) =>
                          handleOrgInputChange("name", e.target.value)
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="org-industry"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Industry
                      </label>
                      <select
                        id="org-industry"
                        value={organizationSettings?.industry || ""}
                        onChange={(e) =>
                          handleOrgInputChange("industry", e.target.value)
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border"
                      >
                        <option value="">Select Industry</option>
                        <option value="technology">Technology</option>
                        <option value="healthcare">Healthcare</option>
                        <option value="finance">Finance</option>
                        <option value="retail">Retail</option>
                        <option value="manufacturing">Manufacturing</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() =>
                        organizationSettings &&
                        updateOrganization({
                          name: organizationSettings.name,
                          industry: organizationSettings.industry,
                        })
                      }
                      disabled={
                        isSaving || !hasOrgChanges || !organizationSettings
                      }
                      className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                        hasOrgChanges && !isSaving
                          ? "bg-primary-600 hover:bg-primary-700"
                          : "bg-gray-400"
                      }`}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {getOrgSaveButtonText()}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
