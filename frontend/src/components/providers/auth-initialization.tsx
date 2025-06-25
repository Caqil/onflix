// frontend/src/components/providers/auth-initialization.tsx
"use client";
import React, { useEffect, useState } from "react";
import { authManager } from "@/lib/auth/manager";
import authAPI from "@/lib/api/auth";

interface AuthInitializationProps {
  children: React.ReactNode;
}

export const AuthInitialization: React.FC<AuthInitializationProps> = ({
  children,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get stored tokens
        const accessToken = authManager.getAccessToken();
        const refreshToken = authManager.getRefreshToken();
        const user = authManager.getUser();

        // If we have tokens stored, restore them in the API client
        if (accessToken && refreshToken && user) {
          // Set tokens in API client first
          authAPI.setTokens(accessToken, refreshToken);

          // Check if token is still valid
          const isAuthenticated = authManager.isAuthenticated();

          if (isAuthenticated) {
            // Check if token is close to expiry and refresh if needed
            const expiry = authManager.getTokenExpiry();
            if (expiry) {
              const now = new Date();
              const fiveMinutesFromNow = new Date(
                now.getTime() + 5 * 60 * 1000
              );

              // If token expires within 5 minutes, refresh it
              if (expiry <= fiveMinutesFromNow) {
                console.log("Token expiring soon, refreshing...");
                const refreshSuccess = await authManager.refreshTokens();
                if (!refreshSuccess) {
                  console.log("Token refresh failed, clearing auth state");
                  authManager.clearTokens();
                }
              }
            }
          } else {
            // Token is expired, try to refresh
            console.log("Token expired, attempting refresh...");
            const refreshSuccess = await authManager.refreshTokens();
            if (!refreshSuccess) {
              console.log("Token refresh failed, clearing auth state");
              authManager.clearTokens();
            }
          }

          // Setup auto refresh for valid tokens
          if (authManager.isAuthenticated()) {
            authManager.setupAutoRefresh();
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Clear potentially corrupted auth state
        authManager.clearTokens();
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
