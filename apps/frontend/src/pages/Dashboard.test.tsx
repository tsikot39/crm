import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { render, mockApiResponses } from "../test/test-utils";
import { Dashboard } from "./Dashboard";

// Mock the dashboard store
const mockFetchDashboardData = vi.fn();
const mockUseDashboardStore = vi.fn(() => ({
  stats: mockApiResponses.dashboard.stats,
  activities: mockApiResponses.dashboard.activities,
  topDeals: mockApiResponses.dashboard.topDeals,
  charts: mockApiResponses.dashboard.charts,
  isLoading: false,
  error: null,
  fetchDashboardData: mockFetchDashboardData,
}));

vi.mock("../stores/dashboardStore", () => ({
  useDashboardStore: () => mockUseDashboardStore(),
}));

describe("Dashboard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dashboard with statistics correctly", () => {
    render(<Dashboard />);

    // Check main dashboard heading using role
    expect(
      screen.getByRole("heading", { name: /dashboard/i })
    ).toBeInTheDocument();

    // Check statistics cards - look for any numbers that match our mock data
    expect(screen.getByText("150")).toBeInTheDocument(); // Total Contacts
    expect(screen.getByText("45")).toBeInTheDocument(); // Total Companies
    expect(screen.getByText("12")).toBeInTheDocument(); // Active Deals
    // The revenue value should be formatted from monthlyRevenue: 250000
    expect(screen.getByText("$250K")).toBeInTheDocument();
  });

  it("displays growth percentages correctly", () => {
    render(<Dashboard />);

    // Check growth indicators
    expect(screen.getByText("+15.5%")).toBeInTheDocument(); // Contacts growth
    expect(screen.getByText("+8.2%")).toBeInTheDocument(); // Companies growth
    expect(screen.getByText("+12.1%")).toBeInTheDocument(); // Deals growth
    expect(screen.getByText("+23.4%")).toBeInTheDocument(); // Revenue growth
  });

  it("shows recent activities", () => {
    render(<Dashboard />);

    // Use getAllByText to handle multiple "Recent Activity" headings
    const recentActivityElements = screen.getAllByText(/recent activity/i);
    expect(recentActivityElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/new contact john doe added/i)).toBeInTheDocument();
  });
  it("displays top deals section", () => {
    render(<Dashboard />);

    expect(screen.getByText(/top deals/i)).toBeInTheDocument();
    expect(screen.getByText(/enterprise deal/i)).toBeInTheDocument();
    expect(screen.getByText("$100K")).toBeInTheDocument();
    expect(screen.getByText("90%")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    mockUseDashboardStore.mockReturnValue({
      stats: null as any,
      activities: [],
      topDeals: [],
      charts: null as any,
      isLoading: true,
      error: null,
      fetchDashboardData: mockFetchDashboardData,
    });

    render(<Dashboard />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows error state", () => {
    mockUseDashboardStore.mockReturnValue({
      stats: null as any,
      activities: [],
      topDeals: [],
      charts: null as any,
      isLoading: false,
      error: "Failed to load dashboard data" as any,
      fetchDashboardData: mockFetchDashboardData,
    });

    render(<Dashboard />);

    expect(screen.getByText(/error/i)).toBeInTheDocument();
    expect(
      screen.getByText(/failed to load dashboard data/i)
    ).toBeInTheDocument();
  });

  it("calls fetchDashboardData on mount", () => {
    render(<Dashboard />);

    expect(mockFetchDashboardData).toHaveBeenCalledOnce();
  });

  it("formats currency correctly", () => {
    render(<Dashboard />);

    // Check that currency formatting is working - look for any $ symbol with K
    expect(screen.getByText(/\$.*K/)).toBeInTheDocument();
  });
  it("renders charts section", () => {
    render(<Dashboard />);

    // Look for chart section headings
    expect(screen.getAllByText(/revenue trend/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/deals pipeline/i).length).toBeGreaterThan(0);
  });
});
