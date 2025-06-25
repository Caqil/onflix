"use client";
import React, { useState } from "react";
import {
  BarChart3,
  Users,
  Video,
  Settings,
  CreditCard,
  FileText,
  Bell,
  Search,
  Menu,
  X,
  LogOut,
  Shield,
  Home,
  HelpCircle,
  ChevronDown,
  Globe,
  Play,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import AdminAnalytics from "./admin/analytics/page";
import AdminContentManagement from "./admin/content/page";
import AdminSettings from "./admin/settings/page";

interface AdminDashboardLayoutProps {
  children?: React.ReactNode;
}

const AdminDashboardLayout: React.FC<AdminDashboardLayoutProps> = ({
  children,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showUserMenu, setShowUserMenu] = useState(false);

  const sidebarItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BarChart3,
      description: "Overview and analytics",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: TrendingUp,
      description: "Detailed analytics and reports",
    },
    {
      id: "users",
      label: "Users",
      icon: Users,
      description: "User management and activity",
    },
    {
      id: "content",
      label: "Content",
      icon: Video,
      description: "Content library management",
    },
    {
      id: "subscriptions",
      label: "Subscriptions",
      icon: CreditCard,
      description: "Subscription and billing management",
    },
    {
      id: "reports",
      label: "Reports",
      icon: FileText,
      description: "Generate and export reports",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      description: "Platform configuration",
    },
  ];

  const renderActiveComponent = () => {
    switch (activeTab) {
      case "analytics":
        return <AdminAnalytics />;
      case "users":
        return <AdminUserManagement />;
      case "content":
        return <AdminContentManagement />;
      case "settings":
        return <AdminSettings />;
      case "dashboard":
      default:
        return <DashboardOverview />;
    }
  };

  const DashboardOverview = () => (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">12,450</p>
              <p className="text-sm text-green-600">+5.2% from last month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Monthly Revenue
              </p>
              <p className="text-2xl font-bold text-gray-900">$125,000</p>
              <p className="text-sm text-green-600">+12.5% from last month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <Video className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Content</p>
              <p className="text-2xl font-bold text-gray-900">1,250</p>
              <p className="text-sm text-blue-600">25 added this week</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <Play className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Active Streams
              </p>
              <p className="text-2xl font-bold text-gray-900">1,847</p>
              <p className="text-sm text-gray-600">Current viewers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveTab("content")}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <Video className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <span className="text-sm font-medium">Add Content</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <span className="text-sm font-medium">Manage Users</span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <BarChart3 className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <span className="text-sm font-medium">View Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <Settings className="h-6 w-6 mx-auto mb-2 text-gray-600" />
            <span className="text-sm font-medium">Settings</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity
        </h2>
        <div className="space-y-3">
          {[
            {
              action: "New user registered",
              user: "john.doe@example.com",
              time: "2 minutes ago",
              type: "user",
            },
            {
              action: "Content uploaded",
              user: "Admin",
              time: "15 minutes ago",
              type: "content",
            },
            {
              action: "Payment failed",
              user: "jane.smith@example.com",
              time: "1 hour ago",
              type: "payment",
            },
            {
              action: "User banned",
              user: "spam.user@example.com",
              time: "2 hours ago",
              type: "security",
            },
            {
              action: "Settings updated",
              user: "Admin",
              time: "3 hours ago",
              type: "system",
            },
          ].map((activity, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-gray-100"
            >
              <div className="flex items-center">
                <div
                  className={`w-2 h-2 rounded-full mr-3 ${
                    activity.type === "user"
                      ? "bg-blue-500"
                      : activity.type === "content"
                      ? "bg-purple-500"
                      : activity.type === "payment"
                      ? "bg-red-500"
                      : activity.type === "security"
                      ? "bg-orange-500"
                      : "bg-gray-500"
                  }`}
                ></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {activity.action}
                  </p>
                  <p className="text-xs text-gray-600">{activity.user}</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`bg-white shadow-lg transition-all duration-300 ${
          sidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {!sidebarCollapsed && (
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Play className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">
                OnFlix Admin
              </span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 rounded-md hover:bg-gray-100"
          >
            {sidebarCollapsed ? (
              <Menu className="w-5 h-5" />
            ) : (
              <X className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === item.id
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  title={sidebarCollapsed ? item.label : ""}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <div className="ml-3 text-left">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-500">
                        {item.description}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 w-full p-3 border-t border-gray-200">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              {!sidebarCollapsed && (
                <>
                  <div className="ml-3 text-left">
                    <div className="font-medium">Admin User</div>
                    <div className="text-xs text-gray-500">
                      admin@onflix.com
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 ml-auto" />
                </>
              )}
            </button>

            {showUserMenu && (
              <div className="absolute bottom-full mb-2 w-full bg-white border border-gray-200 rounded-md shadow-lg">
                <div className="py-1">
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                    <Home className="w-4 h-4 mr-3" />
                    Go to Site
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                    <HelpCircle className="w-4 h-4 mr-3" />
                    Help & Support
                  </button>
                  <div className="border-t border-gray-200"></div>
                  <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center">
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold text-gray-900">
              {sidebarItems.find((item) => item.id === activeTab)?.label ||
                "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Globe/Site Link */}
            <button
              className="p-2 text-gray-600 hover:text-gray-900"
              title="View Site"
            >
              <Globe className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {children || renderActiveComponent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardLayout;
