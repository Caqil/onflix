"use client";
import React from "react";
import {
  TrendingUp,
  Users,
  Play,
  DollarSign,
  Crown,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency } from "../../lib/utils/helpers";
import { useApi } from "../../hooks/use-api";
import { adminAPI, DashboardStats } from "../../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    type: "positive" | "negative" | "neutral";
  };
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  className,
}) => {
  const getTrendColor = (type: string) => {
    switch (type) {
      case "positive":
        return "text-green-600";
      case "negative":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getTrendIcon = (type: string) => {
    switch (type) {
      case "positive":
        return "↗";
      case "negative":
        return "↘";
      default:
        return "→";
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div
            className={`text-xs mt-1 flex items-center ${getTrendColor(
              trend.type
            )}`}
          >
            <span className="mr-1">{getTrendIcon(trend.type)}</span>
            {trend.value}% {trend.label}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const DashboardStatsCards: React.FC = () => {
  const {
    data: stats,
    isLoading,
    error,
  } = useApi<DashboardStats>(() => adminAPI.getDashboardStats());

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded mb-1" />
              <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              Failed to load dashboard stats
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const calculateGrowthRate = (current: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((current / total) * 100);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Users"
        value={stats.total_users.toLocaleString()}
        description="Registered users"
        icon={<Users />}
        trend={{
          value: calculateGrowthRate(stats.new_users_today, stats.total_users),
          label: "new today",
          type: stats.new_users_today > 0 ? "positive" : "neutral",
        }}
      />

      <StatsCard
        title="Active Subscriptions"
        value={stats.active_subscriptions.toLocaleString()}
        description={`${stats.total_subscriptions.toLocaleString()} total subscriptions`}
        icon={<Crown />}
        trend={{
          value: Math.round(
            (stats.active_subscriptions / stats.total_subscriptions) * 100
          ),
          label: "active rate",
          type: "positive",
        }}
      />

      <StatsCard
        title="Monthly Revenue"
        value={formatCurrency(stats.monthly_revenue)}
        description={`${formatCurrency(stats.total_revenue)} total revenue`}
        icon={<DollarSign />}
        trend={{
          value: 12.5, // This would come from backend calculation
          label: "vs last month",
          type: "positive",
        }}
      />

      <StatsCard
        title="Content Library"
        value={stats.total_content.toLocaleString()}
        description={`${stats.published_content.toLocaleString()} published, ${stats.draft_content.toLocaleString()} drafts`}
        icon={<Play />}
      />

      <StatsCard
        title="Watch Time"
        value={`${Math.round(stats.total_watch_time / 3600).toLocaleString()}h`}
        description="Total hours watched"
        icon={<TrendingUp />}
        trend={{
          value: 8.2,
          label: "vs last week",
          type: "positive",
        }}
      />

      <StatsCard
        title="Avg Session"
        value={`${Math.round(stats.average_session_duration / 60)}min`}
        description="Average session duration"
        icon={<TrendingUp />}
      />

      <StatsCard
        title="Failed Payments"
        value={stats.failed_payments.toLocaleString()}
        description="Requires attention"
        icon={<AlertTriangle />}
        trend={{
          value: stats.failed_payments > 0 ? 5.2 : 0,
          label: "this month",
          type: stats.failed_payments > 10 ? "negative" : "neutral",
        }}
      />

      <StatsCard
        title="Churn Rate"
        value={`${stats.churn_rate.toFixed(1)}%`}
        description="Monthly churn rate"
        icon={<TrendingUp />}
        trend={{
          value: stats.churn_rate,
          label: "this month",
          type: stats.churn_rate > 5 ? "negative" : "positive",
        }}
      />
    </div>
  );
};
