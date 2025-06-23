import React, { useState, useEffect } from "react";
import {
  Users,
  Play,
  TrendingUp,
  DollarSign,
  Eye,
  Download,
  Calendar,
  Activity,
  Clock,
  Star,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from "lucide-react";
import { apiService } from "../../services/api";
import {
  formatDuration,
  formatDate,
  formatRelativeTime,
} from "../../utils/helpers";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import Loading, { ListSkeleton } from "../common/Loading";
import { cn } from "../../utils/helpers";

interface DashboardStats {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalContent: number;
    totalRevenue: number;
    monthlyActiveUsers: number;
    averageSessionTime: number;
    conversionRate: number;
    churnRate: number;
  };
  growth: {
    usersGrowth: number;
    revenueGrowth: number;
    contentGrowth: number;
    viewsGrowth: number;
  };
  topContent: Array<{
    id: string;
    title: string;
    poster: string;
    views: number;
    rating: number;
    type: string;
    genre: string[];
  }>;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
    joinedAt: string;
    subscription?: string;
  }>;
  recentActivity: Array<{
    id: string;
    user: string;
    action: string;
    content?: string;
    timestamp: string;
    type: "view" | "subscription" | "registration" | "login";
  }>;
  analytics: {
    dailyViews: Array<{ date: string; views: number; users: number }>;
    deviceStats: Array<{ device: string; percentage: number; users: number }>;
    geographyStats: Array<{
      country: string;
      users: number;
      percentage: number;
    }>;
    subscriptionStats: Array<{ plan: string; count: number; revenue: number }>;
  };
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("7d");

  useEffect(() => {
    fetchDashboardStats();
  }, [dateRange]);

  const fetchDashboardStats = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await apiService.get<DashboardStats>(
        `/admin/dashboard?range=${dateRange}`
      );
      setStats(response.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch dashboard statistics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardStats(true);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <ArrowUp className="h-4 w-4 text-green-500" />
    ) : (
      <ArrowDown className="h-4 w-4 text-red-500" />
    );
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? "text-green-600" : "text-red-600";
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "view":
        return <Play className="h-4 w-4 text-blue-500" />;
      case "subscription":
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case "registration":
        return <Users className="h-4 w-4 text-purple-500" />;
      case "login":
        return <Activity className="h-4 w-4 text-gray-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "view":
        return "bg-blue-100 text-blue-800";
      case "subscription":
        return "bg-green-100 text-green-800";
      case "registration":
        return "bg-purple-100 text-purple-800";
      case "login":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Platform overview and analytics
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <ListSkeleton items={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Platform overview and analytics
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="text-destructive mb-4">{error}</div>
          <Button onClick={() => fetchDashboardStats()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Platform overview and analytics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={cn("h-4 w-4", refreshing && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">
                  {formatNumber(stats.overview.totalUsers)}
                </p>
                <div className="flex items-center gap-1 text-sm">
                  {getGrowthIcon(stats.growth.usersGrowth)}
                  <span className={getGrowthColor(stats.growth.usersGrowth)}>
                    {Math.abs(stats.growth.usersGrowth)}%
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.overview.totalRevenue)}
                </p>
                <div className="flex items-center gap-1 text-sm">
                  {getGrowthIcon(stats.growth.revenueGrowth)}
                  <span className={getGrowthColor(stats.growth.revenueGrowth)}>
                    {Math.abs(stats.growth.revenueGrowth)}%
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Content</p>
                <p className="text-2xl font-bold">
                  {formatNumber(stats.overview.totalContent)}
                </p>
                <div className="flex items-center gap-1 text-sm">
                  {getGrowthIcon(stats.growth.contentGrowth)}
                  <span className={getGrowthColor(stats.growth.contentGrowth)}>
                    {Math.abs(stats.growth.contentGrowth)}%
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Play className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">
                  {formatNumber(stats.overview.activeUsers)}
                </p>
                <div className="flex items-center gap-1 text-sm">
                  {getGrowthIcon(stats.growth.viewsGrowth)}
                  <span className={getGrowthColor(stats.growth.viewsGrowth)}>
                    {Math.abs(stats.growth.viewsGrowth)}%
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Avg Session Time</p>
            <p className="text-xl font-bold">
              {formatDuration(stats.overview.averageSessionTime)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Conversion Rate</p>
            <p className="text-xl font-bold">
              {stats.overview.conversionRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Monthly Active</p>
            <p className="text-xl font-bold">
              {formatNumber(stats.overview.monthlyActiveUsers)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Churn Rate</p>
            <p className="text-xl font-bold">
              {stats.overview.churnRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Top Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topContent.slice(0, 5).map((content, index) => (
                <div key={content.id} className="flex items-center gap-3">
                  <div className="text-sm font-bold text-muted-foreground w-6">
                    #{index + 1}
                  </div>
                  <img
                    src={content.poster}
                    alt={content.title}
                    className="w-12 h-16 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{content.title}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">{content.type}</Badge>
                      <span>{formatNumber(content.views)} views</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span>{content.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentUsers.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className="text-right">
                    {user.subscription && (
                      <Badge variant="secondary" className="mb-1">
                        {user.subscription}
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(user.joinedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="devices">Devices</TabsTrigger>
              <TabsTrigger value="geography">Geography</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="space-y-4">
              <div className="space-y-3">
                {stats.recentActivity.slice(0, 10).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    {getActivityIcon(activity.type)}
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user}</span>{" "}
                        {activity.action}
                        {activity.content && (
                          <span className="text-muted-foreground">
                            {" "}
                            "{activity.content}"
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(activity.timestamp)}
                      </p>
                    </div>
                    <Badge className={getActivityColor(activity.type)}>
                      {activity.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="devices" className="space-y-4">
              <div className="space-y-3">
                {stats.analytics.deviceStats.map((device) => (
                  <div
                    key={device.device}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{device.device}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatNumber(device.users)} users
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {device.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="geography" className="space-y-4">
              <div className="space-y-3">
                {stats.analytics.geographyStats.map((geo) => (
                  <div
                    key={geo.country}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{geo.country}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatNumber(geo.users)} users
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {geo.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="subscriptions" className="space-y-4">
              <div className="space-y-3">
                {stats.analytics.subscriptionStats.map((subscription) => (
                  <div
                    key={subscription.plan}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{subscription.plan}</p>
                      <p className="text-sm text-muted-foreground">
                        {subscription.count} subscribers
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {formatCurrency(subscription.revenue)}
                      </p>
                      <p className="text-sm text-muted-foreground">revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
