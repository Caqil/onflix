"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from 'react';
import { RouteGuardConfig } from "../../types";
import { PageLoading } from "../common/loading";
import { RouteGuard } from "../../lib/auth/guards";
import { NotFound } from "../common/error-handling";
import { useAuth } from "@/hooks/use-auth";

interface AuthGuardProps {
  children: React.ReactNode;
  config?: RouteGuardConfig;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  config = {},
  fallback,
  redirectTo,
}) => {
  const { isAuthenticated, user, isAdmin, hasActiveSubscription } =
    useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

 useEffect(() => {
    const checkAccess = async () => {
      const { hasAccess, reason } = RouteGuard.checkAccess(config);

      if (!hasAccess) {
        switch (reason) {
          case "authentication_required":
            const loginUrl = redirectTo || "/login";
            const currentPath = window.location.pathname;
            const redirectUrl =
              currentPath !== "/"
                ? `${loginUrl}?redirect=${encodeURIComponent(currentPath)}`
                : loginUrl;
            router.push(redirectUrl);
            break;
          case "subscription_required":
            router.push("/profile?tab=subscription");
            break;
          case "admin_required":
          case "insufficient_role":
            router.push("/403");
            break;
        }
      }

      setIsChecking(false);
    };

    checkAccess();
  }, [config, router, redirectTo]);

  if (isChecking) {
    return fallback || <PageLoading message="Checking permissions..." />;
  }

  const { hasAccess } = RouteGuard.checkAccess(config);

  if (!hasAccess) {
    return (
      fallback || (
        <NotFound
          title="Access Denied"
          description="You don't have permission to access this page."
        />
      )
    );
  }

  return <>{children}</>;
};

import type { UserRole } from "../../types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireSubscription?: boolean;
  allowedRoles?: UserRole[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = false,
  requireAdmin = false,
  requireSubscription = false,
  allowedRoles,
  fallback,
  redirectTo,
}) => {
  const config: RouteGuardConfig = {
    requireAuth,
    requireAdmin,
    requireSubscription,
    allowedRoles,
    redirectTo,
  };

  return (
    <AuthGuard config={config} fallback={fallback} redirectTo={redirectTo} children={children} />
  );
};
