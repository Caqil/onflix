"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Menu,
  Bell,
  User,
  LogOut,
  Settings,
  Crown,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";
import { useDebounce } from "../../hooks/use-debounce";
import { cn } from "@/lib/utils/helpers";
import { APP_CONFIG } from "@/lib/utils/constants";
import { useAuth } from "@/hooks/use-auth";
import { useAppContext } from "@/context/app-context";

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className }) => {
  const router = useRouter();
  const { user, isAuthenticated, logout, isAdmin, hasActiveSubscription } =
    useAuth();
  const {
    sidebarOpen,
    setSidebarOpen,
    searchOpen,
    setSearchOpen,
    notifications,
  } = useAppContext();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  React.useEffect(() => {
    if (debouncedSearch && debouncedSearch.length >= 2) {
      router.push(`/search?q=${encodeURIComponent(debouncedSearch)}`);
    }
  }, [debouncedSearch, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getUserInitials = () => {
    if (!user) return "U";
    return `${user.first_name.charAt(0)}${user.last_name.charAt(
      0
    )}`.toUpperCase();
  };

  const getSubscriptionBadge = () => {
    if (!hasActiveSubscription()) return null;

    return (
      <Badge variant="secondary" className="ml-2 text-xs">
        <Crown className="w-3 h-3 mr-1" />
        Premium
      </Badge>
    );
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo and Mobile Menu */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <span className="text-lg font-bold text-primary-foreground">
                N
              </span>
            </div>
            <span className="hidden font-bold sm:inline-block">
              {APP_CONFIG.NAME}
            </span>
          </Link>
        </div>

        {/* Navigation Links - Desktop */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/browse"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Browse
          </Link>
          <Link
            href="/browse?type=movie"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Movies
          </Link>
          <Link
            href="/browse?type=tv_show"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            TV Shows
          </Link>
          {isAuthenticated && (
            <Link
              href="/my-list"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              My List
            </Link>
          )}
        </nav>

        {/* Search and User Actions */}
        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center">
                <Input
                  type="search"
                  placeholder="Search movies, TV shows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                  autoFocus
                  onBlur={() => !searchQuery && setSearchOpen(false)}
                />
              </form>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>
            )}
          </div>

          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-5 w-5" />
                    {notifications.length > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                      >
                        {notifications.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No new notifications
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="flex flex-col items-start p-4"
                      >
                        <div className="font-medium">{notification.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {notification.message}
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user?.avatar_url}
                        alt={user?.first_name}
                      />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.first_name} {user?.last_name}
                        {getSubscriptionBadge()}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
