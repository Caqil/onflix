"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/layout/LoadingSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireSubscription?: boolean;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requireAdmin = false,
  requireSubscription = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, isAdmin, hasActiveSubscription } =
    useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        router.push("/login");
        return;
      }

      if (requireAdmin && !isAdmin) {
        router.push("/");
        return;
      }

      if (requireSubscription && !hasActiveSubscription) {
        router.push("/subscription");
        return;
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    user,
    requireAuth,
    requireAdmin,
    requireSubscription,
    router,
    isAdmin,
    hasActiveSubscription,
  ]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (requireAdmin && !isAdmin) {
    return null;
  }

  if (requireSubscription && !hasActiveSubscription) {
    return null;
  }

  return <>{children}</>;
}
