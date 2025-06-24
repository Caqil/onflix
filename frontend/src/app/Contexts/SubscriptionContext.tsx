("use client");

import React, { createContext, useContext, useState, useEffect } from "react";
import { userAPI } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface SubscriptionContextType {
  // Subscription Data
  subscription: any | null;
  plans: any[];
  paymentMethods: any[];
  invoices: any[];
  usage: any | null;

  // Loading States
  isLoading: boolean;
  isProcessing: boolean;

  // Error State
  error: string | null;

  // Actions
  loadSubscription: () => Promise<void>;
  createSubscription: (
    planId: string,
    paymentMethodId: string
  ) => Promise<void>;
  updateSubscription: (planId: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  pauseSubscription: () => Promise<void>;
  resumeSubscription: () => Promise<void>;
  loadPaymentMethods: () => Promise<void>;
  addPaymentMethod: (paymentMethodId: string) => Promise<void>;
  removePaymentMethod: (methodId: string) => Promise<void>;
  setDefaultPaymentMethod: (methodId: string) => Promise<void>;
  loadInvoices: () => Promise<void>;
  loadUsage: () => Promise<void>;
  clearError: () => void;

  // Computed Properties
  isSubscribed: boolean;
  isActive: boolean;
  isPaused: boolean;
  isCancelled: boolean;
  currentPlan: any | null;
  hasActiveSubscription: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user } = useAuthStore();

  // State
  const [subscription, setSubscription] = useState<any | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [usage, setUsage] = useState<any | null>(null);

  // Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Error State
  const [error, setError] = useState<string | null>(null);

  // Actions
  const loadSubscription = async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await userAPI.getSubscription();
      if (response.data.success) {
        setSubscription(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load subscription");
    } finally {
      setIsLoading(false);
    }
  };

  const createSubscription = async (
    planId: string,
    paymentMethodId: string
  ) => {
    if (!isAuthenticated) return;

    setIsProcessing(true);
    setError(null);
    try {
      const response = await userAPI.createSubscription(
        planId,
        paymentMethodId
      );
      if (response.data.success) {
        setSubscription(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create subscription");
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const updateSubscription = async (planId: string) => {
    if (!isAuthenticated) return;

    setIsProcessing(true);
    setError(null);
    try {
      const response = await userAPI.updateSubscription(planId);
      if (response.data.success) {
        // Reload subscription to get updated data
        await loadSubscription();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update subscription");
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelSubscription = async () => {
    if (!isAuthenticated) return;

    setIsProcessing(true);
    setError(null);
    try {
      const response = await userAPI.cancelSubscription();
      if (response.data.success) {
        setSubscription({ ...subscription, status: "cancelled" });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to cancel subscription");
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const pauseSubscription = async () => {
    if (!isAuthenticated) return;

    setIsProcessing(true);
    setError(null);
    try {
      const response = await userAPI.pauseSubscription();
      if (response.data.success) {
        setSubscription({ ...subscription, status: "paused" });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to pause subscription");
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const resumeSubscription = async () => {
    if (!isAuthenticated) return;

    setIsProcessing(true);
    setError(null);
    try {
      const response = await userAPI.resumeSubscription();
      if (response.data.success) {
        setSubscription({ ...subscription, status: "active" });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to resume subscription");
      throw err;
    } finally {
      setIsProcessing(false);
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

  const addPaymentMethod = async (paymentMethodId: string) => {
    if (!isAuthenticated) return;

    setIsProcessing(true);
    setError(null);
    try {
      const response = await userAPI.addPaymentMethod(paymentMethodId);
      if (response.data.success) {
        await loadPaymentMethods();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add payment method");
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const removePaymentMethod = async (methodId: string) => {
    if (!isAuthenticated) return;

    setIsProcessing(true);
    setError(null);
    try {
      const response = await userAPI.removePaymentMethod(methodId);
      if (response.data.success) {
        setPaymentMethods(paymentMethods.filter((pm) => pm.id !== methodId));
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to remove payment method"
      );
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const setDefaultPaymentMethod = async (methodId: string) => {
    if (!isAuthenticated) return;

    setIsProcessing(true);
    setError(null);
    try {
      const response = await userAPI.setDefaultPaymentMethod(methodId);
      if (response.data.success) {
        setPaymentMethods(
          paymentMethods.map((pm) => ({
            ...pm,
            is_default: pm.id === methodId,
          }))
        );
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to set default payment method"
      );
      throw err;
    } finally {
      setIsProcessing(false);
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

  const clearError = () => setError(null);

  // Computed Properties
  const isSubscribed = !!subscription;
  const isActive = subscription?.status === "active";
  const isPaused = subscription?.status === "paused";
  const isCancelled = subscription?.status === "cancelled";
  const currentPlan = subscription?.plan || null;
  const hasActiveSubscription = isActive || isPaused;

  // Load initial data when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadSubscription();
      loadPaymentMethods();
      loadInvoices();
      loadUsage();
    } else {
      // Clear data when not authenticated
      setSubscription(null);
      setPlans([]);
      setPaymentMethods([]);
      setInvoices([]);
      setUsage(null);
    }
  }, [isAuthenticated, user]);

  const value: SubscriptionContextType = {
    // Data
    subscription,
    plans,
    paymentMethods,
    invoices,
    usage,

    // Loading States
    isLoading,
    isProcessing,

    // Error State
    error,

    // Actions
    loadSubscription,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    pauseSubscription,
    resumeSubscription,
    loadPaymentMethods,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    loadInvoices,
    loadUsage,
    clearError,

    // Computed Properties
    isSubscribed,
    isActive,
    isPaused,
    isCancelled,
    currentPlan,
    hasActiveSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }
  return context;
}
