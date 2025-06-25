"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Play,
  Download,
  Eye,
  Star,
} from "lucide-react";
import { DashboardStats, RevenueStats, StreamingStats, UserGrowthStats } from "@/types";
import { useEffect, useState } from "react";
import adminAPI from "@/lib/api/admin";

const AdminAnalytics: React.FC = () => {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null
  );
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [userGrowthStats, setUserGrowthStats] =
    useState<UserGrowthStats | null>(null);
  const [streamingStats, setStreamingStats] = useState<StreamingStats | null>(
    null
  );
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "year"
  >("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [dashboard, revenue, userGrowth, streaming] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getRevenueStats(selectedPeriod),
        adminAPI.getUserGrowthStats(selectedPeriod),
        adminAPI.getStreamingStats(),
      ]);

      setDashboardStats(dashboard.data);
      setRevenueStats(revenue.data);
      setUserGrowthStats(userGrowth.data);
      setStreamingStats(streaming.data);
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    change,
    color = "blue",
  }: {
    title: string;
    value: string | number;
    icon: any;
    change?: string;
    color?: string;
  }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p
              className={`text-sm ${
                change.startsWith("+") ? "text-green-600" : "text-red-600"
              }`}
            >
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-80 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const qualityData = streamingStats?.streams_by_quality
    ? Object.entries(streamingStats.streams_by_quality).map(
        ([quality, count]) => ({
          name: quality,
          value: count,
        })
      )
    : [];

  const deviceData = streamingStats?.streams_by_device
    ? Object.entries(streamingStats.streams_by_device).map(
        ([device, count]) => ({
          name: device,
          value: count,
        })
      )
    : [];

  const planData = revenueStats?.revenue_by_plan
    ? Object.entries(revenueStats.revenue_by_plan).map(([plan, revenue]) => ({
        name: plan,
        revenue,
      }))
    : [];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Analytics Dashboard
        </h1>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) =>
              setSelectedPeriod(e.target.value as "week" | "month" | "year")
            }
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
          <button
            onClick={fetchAnalyticsData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={formatNumber(dashboardStats?.total_users || 0)}
          icon={Users}
          change={
            userGrowthStats
              ? `+${userGrowthStats.user_growth_rate}%`
              : undefined
          }
          color="blue"
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(dashboardStats?.monthly_revenue || 0)}
          icon={DollarSign}
          change={revenueStats ? `+${revenueStats.revenue_growth}%` : undefined}
          color="green"
        />
        <StatCard
          title="Active Subscriptions"
          value={formatNumber(dashboardStats?.active_subscriptions || 0)}
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="Total Streams"
          value={formatNumber(streamingStats?.total_streams || 0)}
          icon={Play}
          color="red"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueStats?.revenue_by_date || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowthStats?.users_by_date || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: "#10B981" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Plan */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue by Plan</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={planData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="revenue" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Streaming Quality Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            Streaming Quality Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={qualityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {qualityData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Streaming Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Current Streams:</span>
              <span className="font-semibold">
                {formatNumber(streamingStats?.concurrent_streams || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Peak Streams:</span>
              <span className="font-semibold">
                {formatNumber(streamingStats?.peak_concurrent_streams || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bandwidth Usage:</span>
              <span className="font-semibold">
                {streamingStats?.bandwidth_usage
                  ? `${(streamingStats.bandwidth_usage / 1000000).toFixed(
                      2
                    )} GB`
                  : "0 GB"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Content Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Content:</span>
              <span className="font-semibold">
                {formatNumber(dashboardStats?.total_content || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Published:</span>
              <span className="font-semibold">
                {formatNumber(dashboardStats?.published_content || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Draft:</span>
              <span className="font-semibold">
                {formatNumber(dashboardStats?.draft_content || 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Session:</span>
              <span className="font-semibold">
                {dashboardStats?.average_session_duration
                  ? `${Math.round(
                      dashboardStats.average_session_duration / 60
                    )} min`
                  : "0 min"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Churn Rate:</span>
              <span className="font-semibold">
                {dashboardStats?.churn_rate || 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Failed Payments:</span>
              <span className="font-semibold">
                {formatNumber(dashboardStats?.failed_payments || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
