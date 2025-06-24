"use client";

import { useEffect, useState } from "react";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { AnalyticsCharts } from "@/components/admin/AnalyticsCharts";
import { RecentActivity } from "@/components/admin/RecentActivity";
import { adminAPI } from "@/lib/api";
import { LoadingSpinner } from "@/components/layout/LoadingSpinner";

interface DashboardData {
  totalUsers: number;
  activeSubscriptions: number;
  totalContent: number;
  monthlyRevenue: number;
  userGrowth: number;
  contentViews: number;
  recentUsers: any[];
  recentContent: any[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await adminAPI.getDashboardStats();
        setData(response.data.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to the Onflix admin panel</p>
      </div>

      {/* Stats Cards */}
      <DashboardStats data={data} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsCharts />
        <RecentActivity />
      </div>
    </div>
  );
}
