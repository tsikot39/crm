import { render, RenderOptions } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ReactElement } from "react";
import { vi } from "vitest";

// Mock authentication store for tests
export const mockAuthStore = {
  user: {
    id: "test-user-id",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    organizationId: "test-org-id",
    role: "admin",
  },
  token: "mock-jwt-token",
  isAuthenticated: true,
  isLoading: false,
  isInitialized: true,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  checkAuth: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
};

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };

// Mock API responses
export const mockApiResponses = {
  contacts: {
    data: [
      {
        _id: "1",
        name: "John Doe",
        email: "john@example.com",
        phone: "+1234567890",
        jobTitle: "CEO",
        status: "active",
        companyId: "company-1",
        companyName: "Test Company",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 1,
      itemsPerPage: 20,
    },
  },
  companies: {
    data: [
      {
        _id: "company-1",
        name: "Test Company",
        website: "https://test.com",
        industry: "Technology",
        status: "active",
        contactCount: 1,
        dealCount: 0,
        totalValue: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 1,
      itemsPerPage: 20,
    },
  },
  deals: {
    data: [
      {
        _id: "deal-1",
        name: "Test Deal",
        value: 50000,
        stage: "qualified",
        probability: 75,
        expectedCloseDate: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        company: "Test Company",
        contactName: "John Doe",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 1,
      itemsPerPage: 20,
    },
  },
  dashboard: {
    stats: {
      totalContacts: 150,
      totalCompanies: 45,
      activeDeals: 12,
      monthlyRevenue: 250000,
      contactsGrowth: 15.5,
      companiesGrowth: 8.2,
      dealsGrowth: 12.1,
      revenueGrowth: 23.4,
    },
    activities: [
      {
        id: "1",
        type: "contact_added",
        description: "New contact John Doe added",
        timestamp: new Date().toISOString(),
      },
    ],
    topDeals: [
      {
        id: "1",
        name: "Enterprise Deal",
        value: 100000,
        probability: 90,
        expectedCloseDate: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
    ],
    charts: {
      monthlyRevenue: [
        { month: "Jan", revenue: 45000 },
        { month: "Feb", revenue: 52000 },
        { month: "Mar", revenue: 48000 },
      ],
      dealsByStage: {
        lead: 5,
        qualified: 8,
        proposal: 4,
        negotiation: 3,
        "closed-won": 12,
      },
    },
  },
};

// Mock fetch function
export const mockFetch = (url: string, options?: RequestInit) => {
  const method = options?.method || "GET";

  // Auth endpoints
  if (url.includes("/api/auth/login")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            user: mockAuthStore.user,
            token: mockAuthStore.token,
          },
        }),
    } as Response);
  }

  if (url.includes("/api/auth/register")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            user: mockAuthStore.user,
            token: mockAuthStore.token,
          },
        }),
    } as Response);
  }

  // Dashboard endpoint
  if (url.includes("/api/dashboard")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: mockApiResponses.dashboard,
        }),
    } as Response);
  }

  // Contacts endpoints
  if (url.includes("/api/contacts")) {
    if (method === "POST") {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: mockApiResponses.contacts.data[0],
          }),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          ...mockApiResponses.contacts,
        }),
    } as Response);
  }

  // Companies endpoints
  if (url.includes("/api/companies")) {
    if (method === "POST") {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: mockApiResponses.companies.data[0],
          }),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          ...mockApiResponses.companies,
        }),
    } as Response);
  }

  // Deals endpoints
  if (url.includes("/api/deals")) {
    if (method === "POST") {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: mockApiResponses.deals.data[0],
          }),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          ...mockApiResponses.deals,
        }),
    } as Response);
  }

  // Default response
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, data: {} }),
  } as Response);
};
