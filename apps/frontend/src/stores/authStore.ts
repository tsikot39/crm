import { create } from "zustand";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: string;
  organizationId: string;
  preferences?: Record<string, unknown>;
  lastLoginAt?: Date;
  createdAt?: Date | string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  settings: {
    currency: string;
    timezone: string;
    dateFormat: string;
    industry?: string;
    features: string[];
  };
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  organizationName: string;
}

interface AuthStore {
  user: User | null;
  organization: Organization | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  login: (loginData: LoginData) => Promise<void>;
  register: (registerData: RegisterData) => Promise<void>;
  logout: () => void;
  setAuth: (
    user: User,
    organization: Organization | null,
    token: string
  ) => void;
  updateUser: (userData: Partial<User>) => void;
  updateOrganization: (orgData: Partial<Organization>) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => Promise<void>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const useAuthStore = create<AuthStore>()((set, get) => ({
  user: null,
  organization: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  setAuth: (user: User, organization: Organization | null, token: string) => {
    // Store only token in sessionStorage for session persistence
    sessionStorage.setItem("auth_token", token);

    set({
      user,
      organization,
      token,
      isAuthenticated: true,
      isLoading: false,
      isInitialized: true,
    });
  },

  clearAuth: () => {
    // Clear only session token
    sessionStorage.removeItem("auth_token");

    set({
      user: null,
      organization: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
    });
  },

  updateUser: (userData: Partial<User>) => {
    const state = get();
    if (!state.user) return;

    const updatedUser = { ...state.user, ...userData };

    set({
      user: updatedUser,
    });
  },

  updateOrganization: (orgData: Partial<Organization>) => {
    const state = get();

    let updatedOrganization: Organization;

    if (state.organization) {
      // Update existing organization
      updatedOrganization = { ...state.organization, ...orgData };
    } else {
      // Create new organization if none exists
      updatedOrganization = orgData as Organization;
    }

    set({
      organization: updatedOrganization,
    });
  },

  login: async (loginData) => {
    console.log("🏪 Auth Store: Starting login with data:", loginData);
    console.log("🌐 Auth Store: API_BASE_URL:", API_BASE_URL);
    set({ isLoading: true });
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      console.log("📡 Auth Store: Response status:", response.status);
      console.log("📡 Auth Store: Response ok:", response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.log("❌ Auth Store: Error response data:", errorData);
        set({ isLoading: false });
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();
      console.log("✅ Auth Store: Success response data:", data);

      if (data.success) {
        // Set auth data in memory only - MongoDB handles persistence
        get().setAuth(data.data.user, data.data.organization, data.data.token);
        console.log(
          "✅ Login successful - data stored in MongoDB, session active"
        );
      } else {
        console.log("❌ Auth Store: Success=false in response");
        set({ isLoading: false });
        throw new Error(data.message || "Login failed");
      }
    } catch (error) {
      console.log("🔥 Auth Store: Caught error:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (registerData) => {
    set({ isLoading: true });
    console.log("🔄 Starting registration with data:", registerData);
    console.log("🌐 API URL:", API_BASE_URL);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerData),
      });

      console.log("📡 Response status:", response.status);
      console.log("📡 Response ok:", response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Registration error response:", errorData);
        throw new Error(errorData.message || "Registration failed");
      }

      const data = await response.json();
      console.log("✅ Registration success response:", data);

      if (data.success) {
        // Set auth data in memory only - MongoDB handles persistence
        get().setAuth(data.data.user, data.data.organization, data.data.token);
        console.log(
          "✅ Registration successful - data stored in MongoDB, session active"
        );
      } else {
        get().clearAuth();
        throw new Error(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("💥 Registration error:", error);
      get().clearAuth();
      throw error;
    }
  },

  logout: () => {
    // Clear session data only - user data remains in MongoDB
    get().clearAuth();
    console.log(
      "✅ Logout successful - session cleared, data remains in MongoDB"
    );
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  initializeAuth: async () => {
    set({ isLoading: true });

    try {
      // Check for stored session token
      const storedToken = sessionStorage.getItem("auth_token");

      if (storedToken) {
        try {
          // Verify the token with the server and fetch fresh user data
          const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${storedToken}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              // Fetch fresh user data from database
              const profileResponse = await fetch(
                `${API_BASE_URL}/api/auth/profile`,
                {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${storedToken}`,
                    "Content-Type": "application/json",
                  },
                }
              );

              if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                if (profileData.success) {
                  // Token is valid and we have fresh data from database
                  set({
                    user: profileData.data.user,
                    organization: profileData.data.organization,
                    token: storedToken,
                    isAuthenticated: true,
                    isInitialized: true,
                    isLoading: false,
                  });
                  console.log(
                    "✅ Session restored with fresh data from database"
                  );
                  return;
                }
              }
            }
          }

          // Token is invalid, clear it
          sessionStorage.removeItem("auth_token");
        } catch (error) {
          console.error("❌ Error verifying session:", error);
          sessionStorage.removeItem("auth_token");
        }
      }

      // No valid session found, clear auth
      get().clearAuth();
      console.log("ℹ️ No valid session found - user needs to login");
    } catch (error) {
      console.error("❌ Session restoration failed:", error);
      get().clearAuth();
    }
  },
}));
