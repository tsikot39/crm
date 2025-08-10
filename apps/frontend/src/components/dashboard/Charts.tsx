import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface RevenueChartProps {
  monthlyRevenue: { month: string; revenue: number }[];
  className?: string;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
  monthlyRevenue,
  className = "",
}) => {
  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue));
  const totalRevenue = monthlyRevenue.reduce((sum, m) => sum + m.revenue, 0);
  const avgRevenue = totalRevenue / monthlyRevenue.length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div
      className={`bg-white p-6 rounded-lg shadow-sm border border-neutral-200 ${className}`}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">
            Revenue Trend
          </h3>
          <p className="text-sm text-neutral-600">Monthly revenue over time</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-sm text-neutral-500">Total Revenue</div>
        </div>
      </div>

      <div className="space-y-4">
        {monthlyRevenue.map((month, index) => {
          const heightPercentage =
            maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;
          const isAboveAverage = month.revenue > avgRevenue;

          return (
            <div key={month.month} className="flex items-center space-x-4">
              <div className="w-12 text-sm font-medium text-neutral-600 text-right">
                {month.month}
              </div>
              <div className="flex-1 bg-neutral-100 rounded-full h-8 relative overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    isAboveAverage ? "bg-green-500" : "bg-blue-500"
                  }`}
                  style={{
                    width: `${heightPercentage}%`,
                    minWidth: month.revenue > 0 ? "8px" : "0px",
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-start pl-3">
                  <span
                    className={`text-sm font-medium ${
                      heightPercentage > 30 ? "text-white" : "text-neutral-600"
                    }`}
                  >
                    {formatCurrency(month.revenue)}
                  </span>
                </div>
              </div>
              {isAboveAverage && (
                <TrendingUp className="w-4 h-4 text-green-500" />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-neutral-200">
        <div className="flex justify-between text-sm">
          <div>
            <span className="text-neutral-600">Average: </span>
            <span className="font-medium">{formatCurrency(avgRevenue)}</span>
          </div>
          <div>
            <span className="text-neutral-600">Peak: </span>
            <span className="font-medium">{formatCurrency(maxRevenue)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DealsPipelineProps {
  dealsByStage: { [key: string]: number };
  className?: string;
}

export const DealsPipeline: React.FC<DealsPipelineProps> = ({
  dealsByStage,
  className = "",
}) => {
  const stageLabels: { [key: string]: { label: string; color: string } } = {
    lead: { label: "Lead", color: "bg-gray-500" },
    qualified: { label: "Qualified", color: "bg-blue-500" },
    proposal: { label: "Proposal", color: "bg-yellow-500" },
    negotiation: { label: "Negotiation", color: "bg-orange-500" },
    "closed-won": { label: "Closed Won", color: "bg-green-500" },
    "closed-lost": { label: "Closed Lost", color: "bg-red-500" },
  };

  const totalDeals = Object.values(dealsByStage).reduce(
    (sum, count) => sum + count,
    0
  );
  const stageEntries = Object.entries(dealsByStage).filter(
    ([_, count]) => count > 0
  );

  return (
    <div
      className={`bg-white p-6 rounded-lg shadow-sm border border-neutral-200 ${className}`}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">
            Deals Pipeline
          </h3>
          <p className="text-sm text-neutral-600">Distribution by stage</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-neutral-900">
            {totalDeals}
          </div>
          <div className="text-sm text-neutral-500">Total Deals</div>
        </div>
      </div>

      {/* Donut Chart */}
      <div className="flex justify-center mb-6">
        <div className="relative w-48 h-48">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
          >
            {stageEntries.length > 0 ? (
              (() => {
                let currentAngle = 0;
                return stageEntries.map(([stage, count]) => {
                  const percentage = (count / totalDeals) * 100;
                  const angle = (percentage / 100) * 360;
                  const startAngle = currentAngle;
                  const endAngle = currentAngle + angle;
                  currentAngle += angle;

                  const x1 = 50 + 35 * Math.cos((startAngle * Math.PI) / 180);
                  const y1 = 50 + 35 * Math.sin((startAngle * Math.PI) / 180);
                  const x2 = 50 + 35 * Math.cos((endAngle * Math.PI) / 180);
                  const y2 = 50 + 35 * Math.sin((endAngle * Math.PI) / 180);

                  const largeArcFlag = angle > 180 ? 1 : 0;

                  const pathData = [
                    `M 50 50`,
                    `L ${x1} ${y1}`,
                    `A 35 35 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                    "Z",
                  ].join(" ");

                  const stageInfo = stageLabels[stage] || {
                    label: stage,
                    color: "bg-gray-400",
                  };
                  const colorClass = stageInfo.color.replace("bg-", "");

                  return (
                    <path
                      key={stage}
                      d={pathData}
                      fill={`rgb(${
                        colorClass === "gray-500"
                          ? "107 114 128"
                          : colorClass === "blue-500"
                          ? "59 130 246"
                          : colorClass === "yellow-500"
                          ? "234 179 8"
                          : colorClass === "orange-500"
                          ? "249 115 22"
                          : colorClass === "green-500"
                          ? "34 197 94"
                          : colorClass === "red-500"
                          ? "239 68 68"
                          : "107 114 128"
                      })`}
                      stroke="white"
                      strokeWidth="1"
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  );
                });
              })()
            ) : (
              <circle
                cx="50"
                cy="50"
                r="35"
                fill="rgb(229 231 235)"
                stroke="white"
                strokeWidth="1"
              />
            )}
            {/* Center hole */}
            <circle cx="50" cy="50" r="20" fill="white" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-neutral-900">
                {totalDeals}
              </div>
              <div className="text-xs text-neutral-500">Deals</div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {stageEntries.map(([stage, count]) => {
          const percentage =
            totalDeals > 0 ? ((count / totalDeals) * 100).toFixed(1) : "0";
          const stageInfo = stageLabels[stage] || {
            label: stage,
            color: "bg-gray-500",
          };

          return (
            <div key={stage} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${stageInfo.color}`} />
                <span className="text-sm font-medium text-neutral-900">
                  {stageInfo.label}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-neutral-600">{count}</span>
                <span className="text-xs text-neutral-400">
                  ({percentage}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface GrowthMetricsProps {
  metrics: {
    contactsGrowth: number;
    companiesGrowth: number;
    dealsGrowth: number;
    revenueGrowth: number;
  };
  className?: string;
}

export const GrowthMetrics: React.FC<GrowthMetricsProps> = ({
  metrics,
  className = "",
}) => {
  const metricLabels = [
    { key: "contactsGrowth", label: "Contacts", color: "bg-blue-500" },
    { key: "companiesGrowth", label: "Companies", color: "bg-purple-500" },
    { key: "dealsGrowth", label: "Deals", color: "bg-orange-500" },
    { key: "revenueGrowth", label: "Revenue", color: "bg-green-500" },
  ];

  const maxGrowth = Math.max(...Object.values(metrics).map(Math.abs));

  return (
    <div
      className={`bg-white p-6 rounded-lg shadow-sm border border-neutral-200 ${className}`}
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-neutral-900">
          Growth Metrics
        </h3>
        <p className="text-sm text-neutral-600">Monthly growth comparison</p>
      </div>

      <div className="space-y-4">
        {metricLabels.map((metric) => {
          const value = metrics[metric.key as keyof typeof metrics];
          const isPositive = value >= 0;
          const barWidth =
            maxGrowth > 0 ? (Math.abs(value) / maxGrowth) * 100 : 0;

          return (
            <div key={metric.key} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-neutral-900">
                  {metric.label}
                </span>
                <div className="flex items-center space-x-1">
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      isPositive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {value}%
                  </span>
                </div>
              </div>

              <div className="relative bg-neutral-100 rounded-full h-3">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    isPositive ? "bg-green-500" : "bg-red-500"
                  }`}
                  style={{
                    width: `${barWidth}%`,
                    minWidth: Math.abs(value) > 0 ? "4px" : "0px",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-neutral-200">
        <div className="text-xs text-neutral-500 text-center">
          Compared to last month
        </div>
      </div>
    </div>
  );
};

interface ActivityTimelineProps {
  activities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
  className?: string;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  className = "",
}) => {
  const getActivityColor = (type: string) => {
    switch (type) {
      case "contact_added":
        return "bg-blue-500";
      case "deal_created":
        return "bg-green-500";
      case "deal_closed":
        return "bg-emerald-500";
      case "deal_updated":
        return "bg-yellow-500";
      case "company_added":
        return "bg-purple-500";
      case "follow_up":
        return "bg-orange-500";
      case "meeting_scheduled":
        return "bg-indigo-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - activityTime.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return activityTime.toLocaleDateString();
  };

  return (
    <div
      className={`bg-white p-6 rounded-lg shadow-sm border border-neutral-200 ${className}`}
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-neutral-900">
          Recent Activity
        </h3>
        <p className="text-sm text-neutral-600">Latest updates and changes</p>
      </div>

      <div className="space-y-4 max-h-80 overflow-y-auto">
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="relative">
                <div
                  className={`w-3 h-3 rounded-full ${getActivityColor(
                    activity.type
                  )} mt-2`}
                />
                {index < activities.length - 1 && (
                  <div className="absolute top-5 left-1.5 w-0.5 h-6 bg-neutral-200" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-900">
                  {activity.description}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  {formatTimeAgo(activity.timestamp)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-neutral-400" />
            </div>
            <p className="text-sm text-neutral-500">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
};
