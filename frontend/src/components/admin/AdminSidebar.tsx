"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Video,
  Users,
  BarChart3,
  CreditCard,
  Settings,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Content",
    icon: Video,
    children: [
      { name: "All Content", href: "/admin/content" },
      { name: "Add Content", href: "/admin/content/add" },
      { name: "Genres", href: "/admin/content/genres" },
    ],
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    name: "Subscriptions",
    href: "/admin/subscriptions",
    icon: CreditCard,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(["Content"]);
  const pathname = usePathname();

  const toggleExpanded = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/admin" className="text-red-600 text-2xl font-bold">
          ONFLIX
        </Link>
        <p className="text-gray-500 text-sm mt-1">Admin Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => (
          <div key={item.name}>
            {item.children ? (
              <div>
                <button
                  onClick={() => toggleExpanded(item.name)}
                  className="w-full flex items-center justify-between px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <div className="flex items-center">
                    <item.icon className="h-5 w-5 mr-3" />
                    <span>{item.name}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      expandedItems.includes(item.name) ? "rotate-180" : ""
                    )}
                  />
                </button>
                {expandedItems.includes(item.name) && (
                  <div className="ml-8 mt-2 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "block px-3 py-2 text-sm rounded-md",
                          pathname === child.href
                            ? "bg-red-100 text-red-700"
                            : "text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={item.href!}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md",
                  pathname === item.href
                    ? "bg-red-100 text-red-700"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span>{item.name}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:bg-white lg:border-r lg:border-gray-200">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="flex items-center justify-between p-4 border-b">
              <span className="text-lg font-semibold">Admin Panel</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {sidebarContent}
          </div>
          <div className="flex-shrink-0 w-14" />
        </div>
      )}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
