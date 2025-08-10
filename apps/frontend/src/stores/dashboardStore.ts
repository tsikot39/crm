import { create } from "zustand";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface DashboardStats {
  totalContacts: number;
  totalCompanies: number;
  activeDeals: number;
  monthlyRevenue: number;
  contactsGrowth: number;
  companiesGrowth: number;
  dealsGrowth: number;
  revenueGrowth: number;
}

interface Activity {
  id: string;
  type: "contact_added" | "deal_closed" | "follow_up" | "meeting_scheduled";
  description: string;
  timestamp: string;
}

interface Deal {
  id: string;
  name: string;
  value: number;
  probability: number;
  expectedCloseDate: string;
}

interface DashboardStore {
  stats: DashboardStats | null;
  activities: Activity[];
  topDeals: Deal[];
  charts: {
    monthlyRevenue: Array<{ month: string; revenue: number }>;
    dealsByStage: { [key: string]: number };
  } | null;
  isLoading: boolean;
  error: string | null;
  fetchDashboardData: () => Promise<void>;
  clearData: () => void;
}

export const useDashboardStore = create<DashboardStore>()((set) => ({
  stats: null,
  activities: [],
  topDeals: [],
  charts: null,
  isLoading: false,
  error: null,

  fetchDashboardData: async () => {
    set({ isLoading: true, error: null });

    try {
      // Get the token from sessionStorage
      const token = sessionStorage.getItem("auth_token");

      if (!token) {
        console.warn("⚠️ No auth token found for dashboard fetch");
        set({ isLoading: false });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/dashboard`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch dashboard data");
      }

      console.log(
        "✅ Dashboard data fetched from database - no placeholder data"
      );

      set({
        stats: result.data.stats,
        activities: result.data.activities,
        topDeals: result.data.topDeals,
        charts: result.data.charts,
        isLoading: false,
      });
    } catch (error) {
      console.error("❌ Failed to fetch dashboard data:", error);

      // Provide empty default data instead of placeholder data
      const defaultStats: DashboardStats = {
        totalContacts: 0,
        totalCompanies: 0,
        activeDeals: 0,
        monthlyRevenue: 0,
        contactsGrowth: 0,
        companiesGrowth: 0,
        dealsGrowth: 0,
        revenueGrowth: 0,
      };

      set({
        stats: defaultStats,
        activities: [],
        topDeals: [],
        charts: null,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch dashboard data",
        isLoading: false,
      });
    }
  },

  clearData: () => {
    set({
      stats: null,
      activities: [],
      topDeals: [],
      charts: null,
      isLoading: false,
      error: null,
    });
  },
}));
