import React, { useEffect } from "react";
import {
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Loader2,
} from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { useDashboardStore } from "../stores/dashboardStore";

export const Dashboard: React.FC = () => {
  const { stats, activities, topDeals, isLoading, error, fetchDashboardData } =
    useDashboardStore();

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

  const getActivityIconColor = (type: string) => {
    if (type.includes("contact")) return "bg-blue-500";
    if (type.includes("deal")) return "bg-green-500";
    if (type.includes("follow_up")) return "bg-yellow-500";
    return "bg-gray-500";
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
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Welcome back! Here's what's happening with your CRM.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Contacts */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">
                  Total Contacts
                </p>
                <p className="text-2xl font-semibold text-neutral-900">
                  {stats?.totalContacts || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-neutral-500">vs last month</span>
              <span className="ml-2">
                {stats && formatPercentage(stats.contactsGrowth)}
              </span>
            </div>
          </div>

          {/* Total Deals */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">
                  Total Deals
                </p>
                <p className="text-2xl font-semibold text-neutral-900">
                  {stats?.totalDeals || 0}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-neutral-500">vs last month</span>
              <span className="ml-2">
                {stats && formatPercentage(stats.dealsGrowth)}
              </span>
            </div>
          </div>

          {/* Total Companies */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">
                  Total Companies
                </p>
                <p className="text-2xl font-semibold text-neutral-900">
                  {stats?.totalCompanies || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-full">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-neutral-500">vs last month</span>
              <span className="ml-2">
                {stats && formatPercentage(stats.companiesGrowth)}
              </span>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">
                  Total Revenue
                </p>
                <p className="text-2xl font-semibold text-neutral-900">
                  {stats ? formatCurrency(stats.totalRevenue) : "$0"}
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-full">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-neutral-500">vs last month</span>
              <span className="ml-2">
                {stats && formatPercentage(stats.revenueGrowth)}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity and Top Deals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Recent Activities
            </h3>
            <div className="space-y-4">
              {activities && activities.length > 0 ? (
                activities.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${getActivityIconColor(
                        activity.type
                      )}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-900 truncate">
                        {activity.description}
                      </p>
                      <div className="flex items-center mt-1 text-xs text-neutral-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-neutral-500">No recent activities</p>
              )}
            </div>
          </div>

          {/* Top Deals */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Top Deals
            </h3>
            <div className="space-y-4">
              {topDeals && topDeals.length > 0 ? (
                topDeals.map((deal, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {deal.title}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">
                        {deal.company}
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
      </div>
    </DashboardLayout>
  );
};
