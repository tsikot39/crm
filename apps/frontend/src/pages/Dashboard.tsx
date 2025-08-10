import React, { useEffect } from "react";
import {
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { useDashboardStore } from "../stores/dashboardStore";
import {
  RevenueChart,
  DealsPipeline,
  GrowthMetrics,
  ActivityTimeline,
} from "../components/dashboard/Charts";

export const Dashboard: React.FC = () => {
  const {
    stats,
    activities,
    topDeals,
    charts,
    isLoading,
    error,
    fetchDashboardData,
  } = useDashboardStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      notation: "compact",
    }).format(value);
  };

  const getDealProbabilityColor = (probability: number) => {
    if (probability >= 80) return "text-green-600";
    if (probability >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const formatPercentage = (value: number) => {
    const isPositive = value >= 0;
    return (
      <span
        className={`inline-flex items-center ${
          isPositive ? "text-green-600" : "text-red-600"
        }`}
      >
        {isPositive ? (
          <ArrowUpRight className="w-4 h-4 mr-1" />
        ) : (
          <ArrowDownRight className="w-4 h-4 mr-1" />
        )}
        {Math.abs(value)}%
      </span>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg text-neutral-600">
            Loading dashboard...
          </span>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading dashboard
              </h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-500">
                  Total Contacts
                </p>
                <p className="text-2xl font-bold text-neutral-900">
                  {stats?.totalContacts ?? 0}
                </p>
                <p className="text-sm text-neutral-600">
                  {formatPercentage(stats?.contactsGrowth ?? 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-500">
                  Total Companies
                </p>
                <p className="text-2xl font-bold text-neutral-900">
                  {stats?.totalCompanies ?? 0}
                </p>
                <p className="text-sm text-neutral-600">
                  {formatPercentage(stats?.companiesGrowth ?? 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-500">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-neutral-900">
                  {formatCurrency(stats?.monthlyRevenue ?? 0)}
                </p>
                <p className="text-sm text-neutral-600">
                  {formatPercentage(stats?.revenueGrowth ?? 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-500">
                  Active Deals
                </p>
                <p className="text-2xl font-bold text-neutral-900">
                  {stats?.activeDeals ?? 0}
                </p>
                <p className="text-sm text-neutral-600">
                  {formatPercentage(stats?.dealsGrowth ?? 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 1 - Revenue and Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Revenue Trend
            </h3>
            <RevenueChart monthlyRevenue={charts?.monthlyRevenue || []} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Deals Pipeline
            </h3>
            <DealsPipeline dealsByStage={charts?.dealsByStage || {}} />
          </div>
        </div>

        {/* Charts Row 2 - Growth Metrics and Activity Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Growth Metrics
            </h3>
            <GrowthMetrics
              metrics={{
                contactsGrowth: stats?.contactsGrowth || 0,
                companiesGrowth: stats?.companiesGrowth || 0,
                revenueGrowth: stats?.revenueGrowth || 0,
                dealsGrowth: stats?.dealsGrowth || 0,
              }}
            />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Recent Activity
            </h3>
            <ActivityTimeline activities={activities || []} />
          </div>
        </div>

        {/* Top Deals Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Top Deals
          </h3>
          <div className="space-y-4">
            {topDeals && topDeals.length > 0 ? (
              topDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {deal.name}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">
                      Expected:{" "}
                      {new Date(deal.expectedCloseDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-semibold text-neutral-900">
                      {formatCurrency(deal.value)}
                    </p>
                    <p
                      className={`text-xs ${getDealProbabilityColor(
                        deal.probability
                      )}`}
                    >
                      {deal.probability}%
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-neutral-500">No deals available</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
