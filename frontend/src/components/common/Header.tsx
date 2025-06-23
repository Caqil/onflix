import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
  Monitor,
  Bell,
  Play,
  Heart,
  Crown,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useContentSearch } from "../../hooks/useContent";
import { ROUTES, APP_NAME } from "../../utils/constants";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { cn } from "../../utils/helpers";

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, setTheme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  const { query, setQuery, suggestions, search, clearSearch } =
    useContentSearch();

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
      if (
        themeMenuRef.current &&
        !themeMenuRef.current.contains(event.target as Node)
      ) {
        setIsThemeMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      search(searchQuery);
      navigate(`${ROUTES.SEARCH}?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate(ROUTES.HOME);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4" />;
      case "dark":
        return <Moon className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getUserInitials = () => {
    if (!user) return "U";
    return `${user.firstName?.[0] || ""}${
      user.lastName?.[0] || ""
    }`.toUpperCase();
  };

  const isActive = (path: string) => location.pathname === path;

  const navigation = [
    { name: "Home", href: ROUTES.HOME },
    { name: "Browse", href: ROUTES.BROWSE },
    { name: "My List", href: "/watchlist" },
    { name: "Recent", href: "/recent" },
  ];

  if (!isAuthenticated) {
    return (
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to={ROUTES.HOME} className="flex items-center space-x-2">
            <Play className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">{APP_NAME}</span>
          </Link>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
            >
              {getThemeIcon()}
              <span className="sr-only">Toggle theme</span>
            </Button>

            <Button asChild variant="ghost">
              <Link to={ROUTES.LOGIN}>Sign In</Link>
            </Button>

            <Button asChild>
              <Link to={ROUTES.REGISTER}>Get Started</Link>
            </Button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center space-x-8">
          <Link to={ROUTES.HOME} className="flex items-center space-x-2">
            <Play className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">{APP_NAME}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  isActive(item.href)
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Search & User Actions */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative" ref={searchRef}>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="h-9 w-9"
              >
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
            </div>

            {isSearchOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-md border bg-popover p-4 shadow-md animate-in slide-in-from-top-2">
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search movies, shows..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSearch(query);
                        }
                        if (e.key === "Escape") {
                          setIsSearchOpen(false);
                        }
                      }}
                      className="pl-10"
                      autoFocus
                    />
                  </div>

                  {/* Search Suggestions */}
                  {suggestions.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Suggestions
                      </p>
                      {suggestions.slice(0, 5).map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSearch(suggestion)}
                          className="block w-full text-left px-2 py-1 text-sm hover:bg-accent rounded"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        clearSearch();
                        setIsSearchOpen(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSearch(query)}
                      disabled={!query.trim()}
                    >
                      Search
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>

          {/* Theme Selector */}
          <div className="relative" ref={themeMenuRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="h-9 w-9"
            >
              {getThemeIcon()}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {isThemeMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-md border bg-popover p-1 shadow-md animate-in slide-in-from-top-2">
                <button
                  onClick={() => {
                    setTheme("light");
                    setIsThemeMenuOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center px-2 py-2 text-sm rounded-sm hover:bg-accent",
                    theme === "light" && "bg-accent"
                  )}
                >
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </button>
                <button
                  onClick={() => {
                    setTheme("dark");
                    setIsThemeMenuOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center px-2 py-2 text-sm rounded-sm hover:bg-accent",
                    theme === "dark" && "bg-accent"
                  )}
                >
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </button>
                <button
                  onClick={() => {
                    setTheme("system");
                    setIsThemeMenuOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center px-2 py-2 text-sm rounded-sm hover:bg-accent",
                    theme === "system" && "bg-accent"
                  )}
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  System
                </button>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-2 rounded-full hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} alt={user?.firstName} />
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-md border bg-popover p-2 shadow-md animate-in slide-in-from-top-2">
                {/* User Info */}
                <div className="px-2 py-3 border-b">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user?.avatar} alt={user?.firstName} />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email}
                      </p>
                      {user?.subscription && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          <Crown className="h-3 w-3 mr-1" />
                          {user.subscription.plan}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <Link
                    to={ROUTES.PROFILE}
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center px-2 py-2 text-sm hover:bg-accent rounded-sm"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>

                  <Link
                    to="/watchlist"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center px-2 py-2 text-sm hover:bg-accent rounded-sm"
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    My List
                  </Link>

                  <Link
                    to="/subscription"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center px-2 py-2 text-sm hover:bg-accent rounded-sm"
                  >
                    <Crown className="mr-2 h-4 w-4" />
                    Subscription
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center px-2 py-2 text-sm hover:bg-accent rounded-sm"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>

                  {user?.role === "admin" && (
                    <>
                      <div className="my-1 border-t" />
                      <Link
                        to={ROUTES.ADMIN}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center px-2 py-2 text-sm hover:bg-accent rounded-sm text-primary"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </>
                  )}

                  <div className="my-1 border-t" />

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-2 py-2 text-sm hover:bg-accent rounded-sm text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur">
          <nav className="container mx-auto px-4 py-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "block px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
