import { useState, useEffect, useCallback } from 'react';
import { paymentService, Subscription, SubscriptionPlan, PaymentMethod, Invoice } from '../services/payment';

export interface UseSubscriptionReturn {
  subscription: Subscription | null;
  plans: SubscriptionPlan[];
  paymentMethods: PaymentMethod[];
  invoices: Invoice[];
  loading: {
    subscription: boolean;
    plans: boolean;
    paymentMethods: boolean;
    invoices: boolean;
  };
  error: string | null;
  createSubscription: (planId: string, paymentMethodId?: string, couponCode?: string) => Promise<void>;
  updateSubscription: (planId: string) => Promise<void>;
  cancelSubscription: (cancelAtPeriodEnd?: boolean) => Promise<void>;
  reactivateSubscription: () => Promise<void>;
  addPaymentMethod: (data: any) => Promise<void>;
  removePaymentMethod: (paymentMethodId: string) => Promise<void>;
  setDefaultPaymentMethod: (paymentMethodId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState({
    subscription: true,
    plans: true,
    paymentMethods: true,
    invoices: true,
  });
  const [error, setError] = useState<string | null>(null);

  const updateLoading = (key: keyof typeof loading, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  };

  // Fetch current subscription
  const fetchSubscription = useCallback(async () => {
    try {
      updateLoading('subscription', true);
      setError(null);
      const currentSubscription = await paymentService.getCurrentSubscription();
      setSubscription(currentSubscription);
    } catch (err: any) {
      if (err.status !== 404) {
        setError(err.message || 'Failed to fetch subscription');
      }
    } finally {
      updateLoading('subscription', false);
    }
  }, []);

  // Fetch available plans
  const fetchPlans = useCallback(async () => {
    try {
      updateLoading('plans', true);
      const availablePlans = await paymentService.getPlans();
      setPlans(availablePlans);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch plans');
    } finally {
      updateLoading('plans', false);
    }
  }, []);

  // Fetch payment methods
  const fetchPaymentMethods = useCallback(async () => {
    try {
      updateLoading('paymentMethods', true);
      const methods = await paymentService.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch payment methods');
    } finally {
      updateLoading('paymentMethods', false);
    }
  }, []);

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    try {
      updateLoading('invoices', true);
      const billingHistory = await paymentService.getInvoices();
      setInvoices(billingHistory);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch invoices');
    } finally {
      updateLoading('invoices', false);
    }
  }, []);

  // Create new subscription
  const createSubscription = useCallback(async (
    planId: string,
    paymentMethodId?: string,
    couponCode?: string
  ) => {
    try {
      setError(null);
      const result = await paymentService.createSubscription({
        planId,
        paymentMethodId,
        couponCode,
      });
      setSubscription(result.subscription);
      await fetchPaymentMethods(); // Refresh payment methods
    } catch (err: any) {
      setError(err.message || 'Failed to create subscription');
      throw err;
    }
  }, [fetchPaymentMethods]);

  // Update existing subscription
  const updateSubscription = useCallback(async (planId: string) => {
    try {
      setError(null);
      const updatedSubscription = await paymentService.updateSubscription({ planId });
      setSubscription(updatedSubscription);
    } catch (err: any) {
      setError(err.message || 'Failed to update subscription');
      throw err;
    }
  }, []);

  // Cancel subscription
  const cancelSubscription = useCallback(async (cancelAtPeriodEnd = true) => {
    try {
      setError(null);
      const cancelledSubscription = await paymentService.cancelSubscription(cancelAtPeriodEnd);
      setSubscription(cancelledSubscription);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel subscription');
      throw err;
    }
  }, []);

  // Reactivate subscription
  const reactivateSubscription = useCallback(async () => {
    try {
      setError(null);
      const reactivatedSubscription = await paymentService.reactivateSubscription();
      setSubscription(reactivatedSubscription);
    } catch (err: any) {
      setError(err.message || 'Failed to reactivate subscription');
      throw err;
    }
  }, []);

  // Add payment method
  const addPaymentMethod = useCallback(async (data: any) => {
    try {
      setError(null);
      await paymentService.createPaymentMethod(data);
      await fetchPaymentMethods();
    } catch (err: any) {
      setError(err.message || 'Failed to add payment method');
      throw err;
    }
  }, [fetchPaymentMethods]);

  // Remove payment method
  const removePaymentMethod = useCallback(async (paymentMethodId: string) => {
    try {
      setError(null);
      await paymentService.deletePaymentMethod(paymentMethodId);
      setPaymentMethods(prev => prev.filter(method => method.id !== paymentMethodId));
    } catch (err: any) {
      setError(err.message || 'Failed to remove payment method');
      throw err;
    }
  }, []);

  // Set default payment method
  const setDefaultPaymentMethod = useCallback(async (paymentMethodId: string) => {
    try {
      setError(null);
      await paymentService.setDefaultPaymentMethod(paymentMethodId);
      await fetchPaymentMethods();
    } catch (err: any) {
      setError(err.message || 'Failed to set default payment method');
      throw err;
    }
  }, [fetchPaymentMethods]);

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchSubscription(),
      fetchPlans(),
      fetchPaymentMethods(),
      fetchInvoices(),
    ]);
  }, [fetchSubscription, fetchPlans, fetchPaymentMethods, fetchInvoices]);

  // Initial data fetch
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    subscription,
    plans,
    paymentMethods,
    invoices,
    loading,
    error,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    reactivateSubscription,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    refresh,
  };
};

// Hook for checking subscription status
export const useSubscriptionStatus = () => {
  const { subscription, loading } = useSubscription();

  const isActive = subscription?.status === 'active';
  const isTrialing = subscription?.status === 'trialing';
  const isCancelled = subscription?.status === 'cancelled';
  const isExpired = subscription?.status === 'expired';
  const isPastDue = subscription?.status === 'past_due';

  const hasAccess = isActive || isTrialing;
  const willCancelAtPeriodEnd = subscription?.cancelAtPeriodEnd || false;

  const daysUntilExpiry = subscription?.currentPeriodEnd 
    ? Math.ceil((new Date(subscription.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const isNearExpiry = daysUntilExpiry <= 7 && daysUntilExpiry > 0;

  return {
    subscription,
    loading: loading.subscription,
    isActive,
    isTrialing,
    isCancelled,
    isExpired,
    isPastDue,
    hasAccess,
    willCancelAtPeriodEnd,
    daysUntilExpiry,
    isNearExpiry,
  };
};

// Hook for plan comparison
export const usePlanComparison = () => {
  const { plans, subscription } = useSubscription();
  
  const currentPlan = subscription ? plans.find(plan => plan.id === subscription.planId) : null;
  
  const getUpgradePlans = () => {
    if (!currentPlan) return plans;
    return plans.filter(plan => plan.price > currentPlan.price);
  };
  
  const getDowngradePlans = () => {
    if (!currentPlan) return [];
    return plans.filter(plan => plan.price < currentPlan.price);
  };

  return {
    plans,
    currentPlan,
    upgradePlans: getUpgradePlans(),
    downgradePlans: getDowngradePlans(),
  };
};

export default useSubscription;