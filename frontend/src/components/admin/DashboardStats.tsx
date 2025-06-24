"use client";

import {
  Users,
  CreditCard,
  Video,
  DollarSign,
  TrendingUp,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardStatsProps {
  data: {
    totalUsers: number;
    activeSubscriptions: number;
    totalContent: number;
    monthlyRevenue: number;
    userGrowth: number;
    contentViews: number;
  };
}

export function DashboardStats({ data }: DashboardStatsProps) {
  const stats = [
    {
      title: "Total Users",
      value: data.totalUsers.toLocaleString(),
      icon: Users,
      change: `+${data.userGrowth}%`,
      changeType: "positive" as const,
    },
    {
      title: "Active Subscriptions",
      value: data.activeSubscriptions.toLocaleString(),
      icon: CreditCard,
      change: "+12%",
      changeType: "positive" as const,
    },
    {
      title: "Total Content",
      value: data.totalContent.toLocaleString(),
      icon: Video,
      change: "+3%",
      changeType: "positive" as const,
    },
    {
      title: "Monthly Revenue",
      value: `$${data.monthlyRevenue.toLocaleString()}`,
      icon: DollarSign,
      change: "+8%",
      changeType: "positive" as const,
    },
    {
      title: "Content Views",
      value: data.contentViews.toLocaleString(),
      icon: Eye,
      change: "+15%",
      changeType: "positive" as const,
    },
    {
      title: "Growth Rate",
      value: `${data.userGrowth}%`,
      icon: TrendingUp,
      change: "+2%",
      changeType: "positive" as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p
              className={`text-xs ${
                stat.changeType === "positive"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {stat.change} from last month
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
