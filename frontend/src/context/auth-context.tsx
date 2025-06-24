"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { authManager } from "@/lib/auth/manager";
import { useAuth } from "@/hooks/use-auth";
import type { User, AuthState } from "@/types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<any>;
  register: (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    terms_accepted: boolean;
  }) => Promise<any>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  checkPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasActiveSubscription: () => boolean;
  isAdmin: boolean;
  canStream: boolean;
  canDownload: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      // Check if user is already authenticated
      const isAuthenticated = authManager.isAuthenticated();

      if (isAuthenticated) {
        // Try to refresh tokens if they're close to expiry
        await auth.refreshAuth();
      }

      setIsInitialized(true);
    };

    initializeAuth();
  }, [auth.refreshAuth]);

  // Don't render children until auth is initialized
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const value: AuthContextType = {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.login.isLoading || auth.register.isLoading,
    login: auth.login.mutate,
    register: auth.register.mutate,
    logout: auth.logout,
    refreshAuth: auth.refreshAuth,
    checkPermission: auth.checkPermission,
    hasRole: auth.hasRole,
    hasActiveSubscription: auth.hasActiveSubscription,
    isAdmin: auth.isAdmin,
    canStream: auth.canStream,
    canDownload: auth.canDownload,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
