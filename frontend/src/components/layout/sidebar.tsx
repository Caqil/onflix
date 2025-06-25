"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  Search,
  Film,
  Tv,
  Star,
  Clock,
  Download,
  Heart,
  TrendingUp,
  Calendar,
  Award,
  Sparkles,
  Play,
  Users,
  Settings,
  Crown,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils/helpers";
import { GENRES } from "@/lib/utils/constants";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const pathname = usePathname();
  const { isAuthenticated, hasActiveSubscription } = useAuth();

  const mainNavItems = [
    {
      title: "Home",
      href: "/",
      icon: Home,
    },
    {
      title: "Browse",
      href: "/browse",
      icon: Search,
    },
    {
      title: "Movies",
      href: "/browse?type=movie",
      icon: Film,
    },
    {
      title: "TV Shows",
      href: "/browse?type=tv_show",
      icon: Tv,
    },
    {
      title: "New Releases",
      href: "/browse?sort=release_date",
      icon: Calendar,
    },
    {
      title: "Trending",
      href: "/browse?trending=true",
      icon: TrendingUp,
      badge: "Hot",
    },
  ];

  const featuredNavItems = [
    {
      title: "Featured",
      href: "/featured",
      icon: Star,
    },
    {
      title: "Top Rated",
      href: "/browse?sort=rating",
      icon: Award,
    },
    {
      title: "Premium",
      href: "/premium",
      icon: Crown,
      badge: "Pro",
      requiresSubscription: true,
    },
  ];

  const userNavItems = isAuthenticated
    ? [
        {
          title: "My List",
          href: "/my-list",
          icon: Heart,
        },
        {
          title: "Continue Watching",
          href: "/continue-watching",
          icon: Clock,
        },
        {
          title: "Downloads",
          href: "/downloads",
          icon: Download,
        },
      ]
    : [];

  const genreNavItems = GENRES.slice(0, 8).map((genre) => ({
    title: genre,
    href: `/browse?genre=${genre.toLowerCase()}`,
    icon: Sparkles,
  }));

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const NavItem = ({
    item,
    className: itemClassName,
  }: {
    item: {
      title: string;
      href: string;
      icon: React.ComponentType<{ className?: string }>;
      badge?: string;
      requiresSubscription?: boolean;
    };
    className?: string;
  }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    const disabled = item.requiresSubscription && !hasActiveSubscription;

    return (
      <Button
        variant={active ? "default" : "ghost"}
        className={cn(
          "w-full justify-start gap-3 h-10",
          active && "bg-primary text-primary-foreground",
          disabled && "opacity-50 cursor-not-allowed",
          itemClassName
        )}
        asChild={!disabled}
        disabled={disabled}
      >
        {disabled ? (
          <div>
            <Icon className="w-4 h-4" />
            <span className="flex-1 text-left">{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="text-xs">
                {item.badge}
              </Badge>
            )}
          </div>
        ) : (
          <Link href={item.href}>
            <Icon className="w-4 h-4" />
            <span className="flex-1 text-left">{item.title}</span>
            {item.badge && (
              <Badge
                variant={active ? "secondary" : "outline"}
                className="text-xs"
              >
                {item.badge}
              </Badge>
            )}
          </Link>
        )}
      </Button>
    );
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
      {children}
    </h3>
  );

  return (
    <div
      className={cn(
        "hidden lg:block fixed left-0 top-16 w-72 h-[calc(100vh-4rem)] bg-background border-r",
        className
      )}
    >
      <ScrollArea className="h-full py-4">
        <div className="space-y-1 px-3">
          {/* Main Navigation */}
          <div className="space-y-1">
            {mainNavItems.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </div>

          <Separator className="my-4" />

          {/* Featured */}
          <div className="space-y-1">
            <SectionTitle>Featured</SectionTitle>
            {featuredNavItems.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </div>

          {/* User Section - only show if authenticated */}
          {isAuthenticated && (
            <>
              <Separator className="my-4" />
              <div className="space-y-1">
                <SectionTitle>My Content</SectionTitle>
                {userNavItems.map((item) => (
                  <NavItem key={item.href} item={item} />
                ))}
              </div>
            </>
          )}

          <Separator className="my-4" />

          {/* Genres */}
          <div className="space-y-1">
            <SectionTitle>Genres</SectionTitle>
            {genreNavItems.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}

            {/* View All Genres */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-10 text-muted-foreground"
              asChild
            >
              <Link href="/genres">
                <Play className="w-4 h-4" />
                <span className="flex-1 text-left">View All Genres</span>
              </Link>
            </Button>
          </div>

          {/* Premium Upgrade CTA - only show if not subscribed */}
          {isAuthenticated && !hasActiveSubscription && (
            <>
              <Separator className="my-4" />
              <div className="p-3">
                <div className="bg-gradient-to-br from-primary/10 to-purple-600/10 p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Go Premium</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Unlock exclusive content, 4K streaming, and unlimited
                    downloads.
                  </p>
                  <Button size="sm" className="w-full" asChild>
                    <Link href="/upgrade">
                      <Zap className="w-4 h-4 mr-2" />
                      Upgrade Now
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Quick Access */}
          <Separator className="my-4" />
          <div className="space-y-1">
            <SectionTitle>Quick Access</SectionTitle>
            <NavItem
              item={{
                title: "Settings",
                href: "/settings",
                icon: Settings,
              }}
            />
            {isAuthenticated && (
              <NavItem
                item={{
                  title: "Profile",
                  href: "/profile",
                  icon: Users,
                }}
              />
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
