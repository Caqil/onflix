"use client";
import React, { useState } from "react";
import {
  MoreHorizontal,
  Edit,
  Ban,
  Trash2,
  Crown,
  Mail,
  Calendar,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDebounce } from "@/hooks/use-debounce";
import { AdminUser, BanUserData, UserFilters } from "@/types";
import { usePagination } from "@/hooks/use-pagination";
import { adminAPI } from "@/lib/api";
import { formatDate, formatRelativeTime } from "@/lib/utils/helpers";

interface UserTableProps {
  className?: string;
}

export const UserManagementTable: React.FC<UserTableProps> = ({
  className,
}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("");

  const debouncedSearch = useDebounce(searchTerm, 300);

  const {
    currentPage,
    itemsPerPage,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    updatePaginationMeta,
  } = usePagination({ initialLimit: 20 });

  const filters: UserFilters = {
    page: currentPage,
    limit: itemsPerPage,
    search: debouncedSearch || undefined,
    role: selectedRole || undefined,
    status: selectedStatus || undefined,
  };

  const {
    data: usersResponse,
    isLoading,
    error,
    refetch,
  } = useApi(() => adminAPI.getUsers(filters), { enabled: true });

  React.useEffect(() => {
    if (usersResponse?.pagination) {
      updatePaginationMeta(usersResponse.pagination);
    }
  }, [usersResponse?.pagination, updatePaginationMeta]);

  const handleBanUser = async () => {
    if (!selectedUser) return;

    try {
      const banData: BanUserData = {
        reason: banReason,
        duration: banDuration ? parseInt(banDuration) : undefined,
        notify_user: true,
      };

      await adminAPI.banUser(selectedUser.id, banData);

      toast({
        title: "User Banned",
        description: `${selectedUser.first_name} ${selectedUser.last_name} has been banned.`,
      });

      setBanDialogOpen(false);
      setSelectedUser(null);
      setBanReason("");
      setBanDuration("");
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to ban user",
        variant: "destructive",
      });
    }
  };

  const handleUnbanUser = async (user: AdminUser) => {
    try {
      await adminAPI.unbanUser(user.id);

      toast({
        title: "User Unbanned",
        description: `${user.first_name} ${user.last_name} has been unbanned.`,
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to unban user",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (user: AdminUser) => {
    if (user.is_banned) {
      return <Badge variant="destructive">Banned</Badge>;
    }

    if (user.subscription?.status === "active") {
      return <Badge variant="default">Active</Badge>;
    }

    return <Badge variant="secondary">Inactive</Badge>;
  };

  const getRoleBadge = (role: string) => {
    return role === "admin" ? (
      <Badge variant="default" className="bg-purple-100 text-purple-800">
        <Crown className="w-3 h-3 mr-1" />
        Admin
      </Badge>
    ) : (
      <Badge variant="outline">User</Badge>
    );
  };

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Failed to load users</p>
            <Button onClick={refetch}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          Manage user accounts, subscriptions, and access controls
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="banned">Banned</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-muted animate-pulse rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : usersResponse?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                usersResponse?.data?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user)}</TableCell>
                    <TableCell>
                      {user.subscription ? (
                        <Badge
                          variant={
                            user.subscription.status === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {user.subscription.status}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(user.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.last_login ? (
                        <div className="text-sm">
                          {formatRelativeTime(user.last_login)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.is_banned ? (
                            <DropdownMenuItem
                              onClick={() => handleUnbanUser(user)}
                              className="text-green-600"
                            >
                              Unban User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setBanDialogOpen(true);
                              }}
                              className="text-red-600"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Ban User
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {usersResponse?.pagination && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(
                currentPage * itemsPerPage,
                usersResponse.pagination.total_items
              )}{" "}
              of {usersResponse.pagination.total_items} users
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={!usersResponse.pagination.has_previous}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {usersResponse.pagination.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={!usersResponse.pagination.has_next}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Ban User Dialog */}
        <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ban User</DialogTitle>
              <DialogDescription>
                Are you sure you want to ban {selectedUser?.first_name}{" "}
                {selectedUser?.last_name}? This will immediately revoke their
                access to the platform.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ban-reason">Reason for ban</Label>
                <Textarea
                  id="ban-reason"
                  placeholder="Enter the reason for banning this user..."
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ban-duration">Duration (days)</Label>
                <Input
                  id="ban-duration"
                  type="number"
                  placeholder="Leave empty for permanent ban"
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleBanUser}
                disabled={!banReason.trim()}
              >
                Ban User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
