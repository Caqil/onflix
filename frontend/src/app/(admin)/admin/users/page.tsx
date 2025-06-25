"use client";
import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Edit,
  Trash2,
  Ban,
  Shield,
  Mail,
  Calendar,
  MoreHorizontal,
  Crown,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Eye,
  CreditCard,
} from "lucide-react";
import adminAPI from "@/lib/api/admin";
import { AdminUser, UserFilters, BanUserData } from "@/types/admin";
import { UserRole, SubscriptionStatus } from "@/types";

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    has_next: false,
    has_previous: false,
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [banData, setBanData] = useState<BanUserData>({
    reason: "",
    duration: 0,
    notify_user: true,
  });

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getUsers(filters);
      setUsers(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUserId || !banData.reason.trim()) return;

    try {
      await adminAPI.banUser(selectedUserId, banData);
      setShowBanModal(false);
      setSelectedUserId(null);
      setBanData({ reason: "", duration: 0, notify_user: true });
      fetchUsers();
    } catch (error) {
      console.error("Failed to ban user:", error);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await adminAPI.unbanUser(userId);
      fetchUsers();
    } catch (error) {
      console.error("Failed to unban user:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await adminAPI.deleteUser(userId);
      fetchUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const StatusBadge = ({ status }: { status: SubscriptionStatus }) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      past_due: { color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
      cancelled: { color: "bg-red-100 text-red-800", icon: XCircle },
      trialing: { color: "bg-blue-100 text-blue-800", icon: CheckCircle },
      paused: { color: "bg-gray-100 text-gray-800", icon: XCircle },
      unpaid: { color: "bg-red-100 text-red-800", icon: XCircle },
      incomplete: {
        color: "bg-yellow-100 text-yellow-800",
        icon: AlertTriangle,
      },
      incomplete_expired: { color: "bg-red-100 text-red-800", icon: XCircle },
    };

    const config = statusConfig[status] || {
      color: "bg-gray-100 text-gray-800",
      icon: XCircle,
    };
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const RoleBadge = ({ role }: { role: UserRole }) => {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          role === "admin"
            ? "bg-purple-100 text-purple-800"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        {role === "admin" ? (
          <Crown className="w-3 h-3 mr-1" />
        ) : (
          <User className="w-3 h-3 mr-1" />
        )}
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const BanModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-red-600">Ban User</h2>
          <button
            onClick={() => setShowBanModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for ban *
            </label>
            <textarea
              rows={3}
              value={banData.reason}
              onChange={(e) =>
                setBanData({ ...banData, reason: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Enter the reason for banning this user..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (days)
            </label>
            <input
              type="number"
              value={banData.duration}
              onChange={(e) =>
                setBanData({
                  ...banData,
                  duration: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="0 for permanent ban"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave as 0 for permanent ban
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="notify_user"
              checked={banData.notify_user}
              onChange={(e) =>
                setBanData({ ...banData, notify_user: e.target.checked })
              }
              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <label htmlFor="notify_user" className="ml-2 text-sm text-gray-700">
              Notify user via email
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowBanModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBanUser}
              disabled={!banData.reason.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ban User
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Users</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={filters.search || ""}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value, page: 1 })
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={filters.role || ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                role: (e.target.value as UserRole) || undefined,
                page: 1,
              })
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>

          <select
            value={filters.status || ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                status:
                  (e.target.value as "active" | "inactive" | "banned") ||
                  undefined,
                page: 1,
              })
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="banned">Banned</option>
          </select>

          <select
            value={filters.subscription_status || ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                subscription_status:
                  (e.target.value as SubscriptionStatus) || undefined,
                page: 1,
              })
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Subscriptions</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="past_due">Past Due</option>
            <option value="trialing">Trial</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === users.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(users.map((user) => user.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className={`hover:bg-gray-50 ${
                      user.is_banned ? "bg-red-50" : ""
                    }`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(
                              selectedUsers.filter((id) => id !== user.id)
                            );
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            src={user.avatar_url || "/default-avatar.png"}
                            alt={`${user.first_name} ${user.last_name}`}
                            className="h-10 w-10 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "/default-avatar.png";
                            }}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                            {user.is_banned && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                <Ban className="w-3 h-3 mr-1" />
                                Banned
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                          {user.ban_reason && (
                            <div className="text-xs text-red-600 mt-1">
                              Ban reason: {user.ban_reason}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <StatusBadge
                          status={
                            user.subscription_status as SubscriptionStatus
                          }
                        />
                        {user.subscription && (
                          <div className="text-xs text-gray-500">
                            {user.subscription.plan?.toString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        <div>
                          Watch time: {Math.round(user.total_watch_time / 3600)}
                          h
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.content_watched} content watched
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.downloads_count} downloads
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                      {user.last_login && (
                        <div className="text-xs text-gray-500">
                          Last: {new Date(user.last_login).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-800 p-1"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {user.subscription && (
                          <button
                            className="text-purple-600 hover:text-purple-800 p-1"
                            title="Manage Subscription"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}
                        {user.is_banned ? (
                          <button
                            onClick={() => handleUnbanUser(user.id)}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Unban User"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setShowBanModal(true);
                            }}
                            className="text-orange-600 hover:text-orange-800 p-1"
                            title="Ban User"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-800 p-1">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(pagination.current_page - 1) * filters.limit + 1} to{" "}
            {Math.min(
              pagination.current_page * filters.limit,
              pagination.total_items
            )}{" "}
            of {pagination.total_items} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              disabled={!pagination.has_previous}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              disabled={!pagination.has_next}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* User Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {pagination.total_items}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  users.filter(
                    (u) => !u.is_banned && u.subscription_status === "active"
                  ).length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <Crown className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u) => u.role === "admin").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <Ban className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Banned Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u) => u.is_banned).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showBanModal && <BanModal />}
    </div>
  );
};
