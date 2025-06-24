"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { userAPI } from "@/lib/api";
import { User } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";

interface UserContextType {
  // User Profile Data
  profile: User | null;
  preferences: any | null;
  devices: any[];
  notifications: any[];

  // Subscription Data
  subscription: any | null;
  paymentMethods: any[];
  invoices: any[];
  usage: any | null;

  // Watchlist & History
  watchlist: any[];
  watchHistory: any[];

  // Loading States
  isLoadingProfile: boolean;
  isLoadingSubscription: boolean;
  isLoadingPreferences: boolean;

  // Error State
  error: string | null;

  // Actions
  loadProfile: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  loadPreferences: () => Promise<void>;
  updatePreferences: (preferences: any) => Promise<void>;
  loadSubscription: () => Promise<void>;
  loadPaymentMethods: () => Promise<void>;
  loadInvoices: () => Promise<void>;
  loadUsage: () => Promise<void>;
  loadDevices: () => Promise<void>;
  loadNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  clearError: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();

  // State
  const [profile, setProfile] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<any | null>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [usage, setUsage] = useState<any | null>(null);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [watchHistory, setWatchHistory] = useState<any[]>([]);

  // Loading States
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false);

  // Error State
  const [error, setError] = useState<string | null>(null);

  // Actions
  const loadProfile = async () => {
    if (!isAuthenticated) return;

    setIsLoadingProfile(true);
    setError(null);
    try {
      const response = await userAPI.getProfile();
      if (response.data.success) {
        setProfile(response.data.data ?? null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const updateProfile = async (data: any) => {
    if (!isAuthenticated) return;

    setIsLoadingProfile(true);
    setError(null);
    try {
      const response = await userAPI.updateProfile(data);
      if (response.data.success) {
        setProfile(response.data.data ?? null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
      throw err;
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadPreferences = async () => {
    if (!isAuthenticated) return;

    setIsLoadingPreferences(true);
    setError(null);
    try {
      const response = await userAPI.getPreferences();
      if (response.data.success) {
        setPreferences(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load preferences");
    } finally {
      setIsLoadingPreferences(false);
    }
  };

  const updatePreferences = async (prefs: any) => {
    if (!isAuthenticated) return;

    setError(null);
    try {
      const response = await userAPI.updatePreferences(prefs);
      if (response.data.success) {
        setPreferences({ ...preferences, ...prefs });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update preferences");
      throw err;
    }
  };

  const loadSubscription = async () => {
    if (!isAuthenticated) return;

    setIsLoadingSubscription(true);
    setError(null);
    try {
      const response = await userAPI.getSubscription();
      if (response.data.success) {
        setSubscription(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load subscription");
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  const loadPaymentMethods = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await userAPI.getPaymentMethods();
      if (response.data.success) {
        setPaymentMethods(response.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load payment methods");
    }
  };

  const loadInvoices = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await userAPI.getInvoices();
      if (response.data.success) {
        setInvoices(response.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load invoices");
    }
  };

  const loadUsage = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await userAPI.getUsage();
      if (response.data.success) {
        setUsage(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load usage");
    }
  };

  const loadDevices = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await userAPI.getDevices();
      if (response.data.success) {
        setDevices(response.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load devices");
    }
  };

  const loadNotifications = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await userAPI.getNotifications();
      if (response.data.success) {
        setNotifications(response.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load notifications");
    }
  };

  const markNotificationAsRead = async (id: string) => {
    if (!isAuthenticated) return;

    try {
      const response = await userAPI.markNotificationAsRead(id);
      if (response.data.success) {
        setNotifications(
          notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to mark notification as read"
      );
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await userAPI.markAllNotificationsAsRead();
      if (response.data.success) {
        setNotifications(notifications.map((n) => ({ ...n, read: true })));
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to mark all notifications as read"
      );
    }
  };

  const clearError = () => setError(null);

  // Load initial data when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadProfile();
      loadPreferences();
      loadSubscription();
      loadPaymentMethods();
      loadDevices();
      loadNotifications();
    } else {
      // Clear data when not authenticated
      setProfile(null);
      setPreferences(null);
      setDevices([]);
      setNotifications([]);
      setSubscription(null);
      setPaymentMethods([]);
      setInvoices([]);
      setUsage(null);
      setWatchlist([]);
      setWatchHistory([]);
    }
  }, [isAuthenticated, user]);

  const value: UserContextType = {
    // Data
    profile,
    preferences,
    devices,
    notifications,
    subscription,
    paymentMethods,
    invoices,
    usage,
    watchlist,
    watchHistory,

    // Loading States
    isLoadingProfile,
    isLoadingSubscription,
    isLoadingPreferences,

    // Error State
    error,

    // Actions
    loadProfile,
    updateProfile,
    loadPreferences,
    updatePreferences,
    loadSubscription,
    loadPaymentMethods,
    loadInvoices,
    loadUsage,
    loadDevices,
    loadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearError,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
