import React, { useState, useEffect, useCallback, useRef } from "react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { useAuthStore } from "../stores/authStore";
import {
  TrendingUp,
  Users,
  Building2,
  DollarSign,
  Target,
  Calendar,
  Activity,
  ChevronDown,
} from "lucide-react";

interface AnalyticsData {
  totalDeals: number;
  totalValue: number;
  totalContacts: number;
  totalCompanies: number;
  conversionRate: number;
  avgDealSize: number;
  dealsByStage: { [key: string]: number };
  monthlyRevenue: { month: string; revenue: number }[];
}

interface Deal {
  _id: string;
  title: string;
  value: number;
  stage: string;
  contactName?: string;
  company?: string;
  createdAt: string;
}

interface Contact {
  _id: string;
  name: string;
  email: string;
}

interface Company {
  _id: string;
  name: string;
}

export const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 6))
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const { token } = useAuthStore();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowExportMenu(false);
      }
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const applyDateRangeFilter = useCallback(
    (deals: Deal[]) => {
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate + "T23:59:59");

      return deals.filter((deal: Deal) => {
        const dealDate = new Date(deal.createdAt);
        return dealDate >= startDate && dealDate <= endDate;
      });
    },
    [dateRange.startDate, dateRange.endDate]
  );

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch deals, contacts, and companies data for analytics
      const [dealsResponse, contactsResponse, companiesResponse] =
        await Promise.all([
          fetch(`http://localhost:3001/api/deals?limit=1000`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          fetch("http://localhost:3001/api/contacts?limit=1000", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          fetch("http://localhost:3001/api/companies?limit=1000", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
        ]);

      if (!dealsResponse.ok || !contactsResponse.ok || !companiesResponse.ok) {
        throw new Error("Failed to fetch analytics data");
      }

      const dealsData = await dealsResponse.json();
      const contactsData = await contactsResponse.json();
      const companiesData = await companiesResponse.json();

      const allDeals = dealsData.data?.deals || [];
      const contacts = contactsData.data?.contacts || [];
      const companies = companiesData.data?.companies || [];

      // Apply date range filtering to deals
      const deals = applyDateRangeFilter(allDeals);

      // Calculate analytics
      const totalDeals = deals.length;
      const totalValue = deals.reduce(
        (sum: number, deal: Deal) => sum + deal.value,
        0
      );
      const totalContacts = contacts.length;
      const totalCompanies = companies.length;
      const closedWonDeals = deals.filter(
        (deal: Deal) => deal.stage === "closed-won"
      );
      const conversionRate =
        totalDeals > 0 ? (closedWonDeals.length / totalDeals) * 100 : 0;
      const avgDealSize = totalDeals > 0 ? totalValue / totalDeals : 0;

      // Deals by stage
      const dealsByStage = deals.reduce(
        (acc: { [key: string]: number }, deal: Deal) => {
          acc[deal.stage] = (acc[deal.stage] || 0) + 1;
          return acc;
        },
        {}
      );

      // Calculate real monthly revenue from closed-won deals
      const monthlyRevenueMap: { [key: string]: number } = {};
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      // Initialize last 6 months with 0 revenue
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = monthNames[date.getMonth()];
        monthlyRevenueMap[monthKey] = 0;
      }

      // Calculate revenue from closed-won deals based on creation date
      closedWonDeals.forEach((deal: Deal) => {
        const dealDate = new Date(deal.createdAt);
        const monthKey = monthNames[dealDate.getMonth()];

        // Only include deals from the last 6 months
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        if (dealDate >= sixMonthsAgo && monthKey in monthlyRevenueMap) {
          monthlyRevenueMap[monthKey] += deal.value;
        }
      });

      // Convert to array format for chart
      const monthlyRevenue = Object.entries(monthlyRevenueMap).map(
        ([month, revenue]) => ({
          month,
          revenue,
        })
      );

      setAnalyticsData({
        totalDeals,
        totalValue,
        totalContacts,
        totalCompanies,
        conversionRate,
        avgDealSize,
        dealsByStage,
        monthlyRevenue,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching analytics data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token, applyDateRangeFilter]);

  useEffect(() => {
    if (token) {
      fetchAnalyticsData();
    }
  }, [token, fetchAnalyticsData]);

  const setDateRangePreset = (preset: string) => {
    const now = new Date();
    let startDate: Date;
    const endDate = new Date();

    switch (preset) {
      case "last7days":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "last30days":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "last3months":
        startDate = new Date(
          now.getFullYear(),
          now.getMonth() - 3,
          now.getDate()
        );
        break;
      case "last6months":
        startDate = new Date(
          now.getFullYear(),
          now.getMonth() - 6,
          now.getDate()
        );
        break;
      case "thisYear":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return;
    }

    setDateRange({
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    });
    setShowDatePicker(false);
  };

  const handleCustomDateRange = () => {
    setShowDatePicker(false);
  };

  const exportToPDF = async () => {
    if (!analyticsData) return;

    setIsExporting(true);
    try {
      // Create HTML content for the report
      const reportContent = `
        <html>
          <head>
            <title>Analytics Report - ${new Date().toLocaleDateString()}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              .header { text-align: center; margin-bottom: 30px; }
              .metric-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
              .metric-card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
              .metric-title { font-size: 14px; color: #666; margin-bottom: 5px; }
              .metric-value { font-size: 24px; font-weight: bold; color: #333; }
              .section { margin-bottom: 30px; }
              .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #333; }
              .stage-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 10px; border: 1px solid #eee; border-radius: 4px; }
              .revenue-row { display: flex; justify-content: space-between; margin-bottom: 8px; padding: 8px; border-bottom: 1px solid #eee; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>CRM Analytics Report</h1>
              <p>Generated on ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="metric-grid">
              <div class="metric-card">
                <div class="metric-title">Total Deals</div>
                <div class="metric-value">${analyticsData.totalDeals}</div>
              </div>
              <div class="metric-card">
                <div class="metric-title">Total Pipeline Value</div>
                <div class="metric-value">${formatCurrency(
                  analyticsData.totalValue
                )}</div>
              </div>
              <div class="metric-card">
                <div class="metric-title">Total Contacts</div>
                <div class="metric-value">${analyticsData.totalContacts}</div>
              </div>
              <div class="metric-card">
                <div class="metric-title">Total Companies</div>
                <div class="metric-value">${analyticsData.totalCompanies}</div>
              </div>
            </div>

            <div class="metric-grid">
              <div class="metric-card">
                <div class="metric-title">Conversion Rate</div>
                <div class="metric-value">${analyticsData.conversionRate.toFixed(
                  1
                )}%</div>
              </div>
              <div class="metric-card">
                <div class="metric-title">Average Deal Size</div>
                <div class="metric-value">${formatCurrency(
                  analyticsData.avgDealSize
                )}</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Deals by Stage</div>
              ${Object.entries(analyticsData.dealsByStage)
                .map(
                  ([stage, count]) => `
                <div class="stage-row">
                  <span>${getStageLabel(stage)}</span>
                  <span>${count} deals (${(
                    (count / analyticsData.totalDeals) *
                    100
                  ).toFixed(1)}%)</span>
                </div>
              `
                )
                .join("")}
            </div>

            <div class="section">
              <div class="section-title">Monthly Revenue (Last 6 Months)</div>
              ${analyticsData.monthlyRevenue
                .map(
                  (data) => `
                <div class="revenue-row">
                  <span>${data.month}</span>
                  <span>${formatCurrency(data.revenue)}</span>
                </div>
              `
                )
                .join("")}
            </div>
          </body>
        </html>
      `;

      // Create and download the report
      const blob = new Blob([reportContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analytics-report-${
        new Date().toISOString().split("T")[0]
      }.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting report:", error);
      setError("Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = async () => {
    if (!analyticsData) return;

    setIsExporting(true);
    try {
      // Fetch detailed deals data for CSV export
      const dealsResponse = await fetch(
        "http://localhost:3001/api/deals?limit=1000",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const dealsData = await dealsResponse.json();
      const deals = dealsData.data?.deals || [];

      // Create CSV content
      let csvContent = "data:text/csv;charset=utf-8,";

      // Summary section
      csvContent += "CRM Analytics Report\n";
      csvContent += `Generated on,${new Date().toLocaleString()}\n\n`;
      csvContent += "Summary Metrics\n";
      csvContent += "Metric,Value\n";
      csvContent += `Total Deals,${analyticsData.totalDeals}\n`;
      csvContent += `Total Pipeline Value,${analyticsData.totalValue}\n`;
      csvContent += `Total Contacts,${analyticsData.totalContacts}\n`;
      csvContent += `Total Companies,${analyticsData.totalCompanies}\n`;
      csvContent += `Conversion Rate,${analyticsData.conversionRate.toFixed(
        1
      )}%\n`;
      csvContent += `Average Deal Size,${analyticsData.avgDealSize}\n\n`;

      // Deals by stage
      csvContent += "Deals by Stage\n";
      csvContent += "Stage,Count,Percentage\n";
      Object.entries(analyticsData.dealsByStage).forEach(([stage, count]) => {
        csvContent += `${getStageLabel(stage)},${count},${(
          (count / analyticsData.totalDeals) *
          100
        ).toFixed(1)}%\n`;
      });
      csvContent += "\n";

      // Monthly revenue
      csvContent += "Monthly Revenue\n";
      csvContent += "Month,Revenue\n";
      analyticsData.monthlyRevenue.forEach((data) => {
        csvContent += `${data.month},${data.revenue}\n`;
      });
      csvContent += "\n";

      // Detailed deals data
      csvContent += "Detailed Deals Data\n";
      csvContent += "Title,Value,Stage,Contact,Company,Created Date\n";
      deals.forEach((deal: Deal) => {
        csvContent += `"${deal.title}",${deal.value},"${deal.stage}","${
          deal.contactName || ""
        }","${deal.company || ""}","${new Date(
          deal.createdAt
        ).toLocaleDateString()}"\n`;
      });

      // Create and download CSV
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `analytics-report-${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      setError("Failed to export CSV report");
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStageLabel = (stage: string) => {
    const stageLabels: { [key: string]: string } = {
      lead: "Lead",
      qualified: "Qualified",
      proposal: "Proposal",
      negotiation: "Negotiation",
      "closed-won": "Closed Won",
      "closed-lost": "Closed Lost",
    };
    return stageLabels[stage] || stage;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="text-neutral-600">Loading analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">
              Error loading analytics
            </div>
            <button
              onClick={() => fetchAnalyticsData()}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!analyticsData) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-neutral-600">No analytics data available</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Analytics & Reports
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Get insights into your sales performance and business metrics.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <div className="relative" ref={datePickerRef}>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Date Range
              </button>

              {showDatePicker && (
                <div className="absolute left-0 z-10 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Select Date Range
                    </h3>

                    {/* Quick presets */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <button
                        onClick={() => setDateRangePreset("last7days")}
                        className="px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        Last 7 days
                      </button>
                      <button
                        onClick={() => setDateRangePreset("last30days")}
                        className="px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        Last 30 days
                      </button>
                      <button
                        onClick={() => setDateRangePreset("last3months")}
                        className="px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        Last 3 months
                      </button>
                      <button
                        onClick={() => setDateRangePreset("last6months")}
                        className="px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        Last 6 months
                      </button>
                    </div>

                    {/* Custom date inputs */}
                    <div className="space-y-3">
                      <div>
                        <label
                          htmlFor="startDate"
                          className="block text-xs font-medium text-gray-700 mb-1"
                        >
                          Start Date
                        </label>
                        <input
                          id="startDate"
                          type="date"
                          value={dateRange.startDate}
                          onChange={(e) =>
                            setDateRange((prev) => ({
                              ...prev,
                              startDate: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="endDate"
                          className="block text-xs font-medium text-gray-700 mb-1"
                        >
                          End Date
                        </label>
                        <input
                          id="endDate"
                          type="date"
                          value={dateRange.endDate}
                          onChange={(e) =>
                            setDateRange((prev) => ({
                              ...prev,
                              endDate: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <button
                        onClick={handleCustomDateRange}
                        className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Apply Date Range
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={isExporting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Activity className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting..." : "Export Report"}
                <ChevronDown className="h-4 w-4 ml-1" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 z-10 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1" role="menu">
                    <button
                      onClick={() => {
                        exportToPDF();
                        setShowExportMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      role="menuitem"
                    >
                      <Activity className="h-4 w-4 mr-3" />
                      Export as HTML
                    </button>
                    <button
                      onClick={() => {
                        exportToCSV();
                        setShowExportMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      role="menuitem"
                    >
                      <Activity className="h-4 w-4 mr-3" />
                      Export as CSV
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Deals
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {analyticsData.totalDeals}
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
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Pipeline Value
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(analyticsData.totalValue)}
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
                    <Users className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Contacts
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {analyticsData.totalContacts}
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
                  <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Companies
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {analyticsData.totalCompanies}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Conversion Rate
              </h3>
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-2xl font-bold text-gray-900">
                      {analyticsData.conversionRate.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Deals closed successfully
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Average Deal Size
              </h3>
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-2xl font-bold text-gray-900">
                      {formatCurrency(analyticsData.avgDealSize)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Per deal average</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deals by Stage */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Deals by Stage
            </h3>
            <div className="space-y-4">
              {Object.entries(analyticsData.dealsByStage).map(
                ([stage, count]) => (
                  <div
                    key={stage}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                      <span className="text-sm font-medium text-gray-900">
                        {getStageLabel(stage)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">
                        {count} deals
                      </span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (count / analyticsData.totalDeals) * 100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Monthly Revenue Chart */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Monthly Revenue Trend
            </h3>
            <div className="grid grid-cols-6 gap-4">
              {analyticsData.monthlyRevenue.map((data) => (
                <div key={data.month} className="text-center">
                  <div className="flex items-end justify-center h-32 mb-2">
                    <div
                      className="w-8 bg-blue-500 rounded-t"
                      style={{
                        height: `${
                          (data.revenue /
                            Math.max(
                              ...analyticsData.monthlyRevenue.map(
                                (d) => d.revenue
                              )
                            )) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">{data.month}</div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(data.revenue)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
