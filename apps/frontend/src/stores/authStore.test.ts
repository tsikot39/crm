import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useAuthStore } from "./authStore";

// Mock fetch globally
const mockFetch = vi.fn();
window.fetch = mockFetch;

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "sessionStorage", {
  value: mockSessionStorage,
  writable: true,
});

describe("AuthStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);

    // Reset store state
    useAuthStore.setState({
      user: null,
      organization: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("should login user successfully", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "user",
        organizationId: "org1",
      };

      const mockResponse = {
        success: true,
        data: {
          user: mockUser,
          organization: { id: "org1", name: "Test Org" },
          token: "mock-token",
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const { login } = useAuthStore.getState();
      await login({ email: "test@example.com", password: "password123" });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.token).toBe("mock-token");
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        "auth_token",
        "mock-token"
      );
    });

    it("should handle login failure", async () => {
      const mockErrorResponse = {
        success: false,
        message: "Invalid credentials",
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve(mockErrorResponse),
      });

      const { login } = useAuthStore.getState();

      await expect(
        login({ email: "test@example.com", password: "wrong" })
      ).rejects.toThrow("Invalid credentials");

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { login } = useAuthStore.getState();

      await expect(
        login({ email: "test@example.com", password: "password" })
      ).rejects.toThrow("Network error");

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe("register", () => {
    it("should register user successfully", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "admin",
        organizationId: "org1",
      };

      const mockResponse = {
        success: true,
        data: {
          user: mockUser,
          organization: { id: "org1", name: "Test Org" },
          token: "mock-token",
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const { register } = useAuthStore.getState();
      await register({
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "password123",
        organizationName: "Test Org",
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it("should handle registration failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ message: "User already exists" }),
      });

      const { register } = useAuthStore.getState();

      await expect(
        register({
          firstName: "Test",
          lastName: "User",
          email: "existing@example.com",
          password: "password123",
          organizationName: "Test Org",
        })
      ).rejects.toThrow("User already exists");
    });
  });

  describe("logout", () => {
    it("should clear user session", () => {
      // Set initial authenticated state
      useAuthStore.setState({
        user: {
          id: "1",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          role: "user",
          organizationId: "org1",
        },
        token: "token",
        isAuthenticated: true,
      });

      const { logout } = useAuthStore.getState();
      logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith("auth_token");
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith("user_data");
    });
  });

  describe("initializeAuth", () => {
    it("should initialize from stored session", async () => {
      const mockUserData = JSON.stringify({
        user: { id: "1", email: "test@example.com" },
        organization: { id: "org1", name: "Test Org" },
      });

      mockSessionStorage.getItem.mockImplementation((key) => {
        if (key === "auth_token") return "stored-token";
        if (key === "user_data") return mockUserData;
        return null;
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              user: { id: "1", email: "test@example.com" },
              organization: { id: "org1", name: "Test Org" },
            },
          }),
      });

      const { initializeAuth } = useAuthStore.getState();
      await initializeAuth();

      const state = useAuthStore.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.isAuthenticated).toBe(true);
    });

    it("should handle invalid stored token", async () => {
      mockSessionStorage.getItem.mockReturnValue("invalid-token");

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const { initializeAuth } = useAuthStore.getState();
      await initializeAuth();

      const state = useAuthStore.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.isAuthenticated).toBe(false);
    });

    it("should handle no stored session", async () => {
      mockSessionStorage.getItem.mockReturnValue(null);

      const { initializeAuth } = useAuthStore.getState();
      await initializeAuth();

      const state = useAuthStore.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe("setAuth", () => {
    it("should set authentication state", () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "user",
        organizationId: "org1",
      };

      const mockOrganization = {
        id: "org1",
        name: "Test Org",
        slug: "test-org",
        plan: "starter",
        settings: {
          currency: "USD",
          timezone: "UTC",
          dateFormat: "MM/DD/YYYY",
          features: [],
        },
      };

      const { setAuth } = useAuthStore.getState();
      setAuth(mockUser, mockOrganization, "test-token");

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.organization).toEqual(mockOrganization);
      expect(state.token).toBe("test-token");
      expect(state.isAuthenticated).toBe(true);
      expect(state.isInitialized).toBe(true);
    });
  });

  describe("updateUser", () => {
    it("should update user data", () => {
      const initialUser = {
        id: "1",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "user",
        organizationId: "org1",
      };

      useAuthStore.setState({
        user: initialUser,
        isAuthenticated: true,
      });

      const { updateUser } = useAuthStore.getState();
      updateUser({ firstName: "Updated", lastName: "Name" });

      const state = useAuthStore.getState();
      expect(state.user?.firstName).toBe("Updated");
      expect(state.user?.lastName).toBe("Name");
      expect(state.user?.email).toBe("test@example.com"); // Should preserve other fields
    });

    it("should do nothing if no user is logged in", () => {
      const { updateUser } = useAuthStore.getState();
      updateUser({ firstName: "Updated" });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
    });
  });
});
