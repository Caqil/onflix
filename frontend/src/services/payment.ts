import { apiService, ApiResponse } from './api';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  maxDevices: number;
  quality: string[];
  downloads: boolean;
  ads: boolean;
  popular?: boolean;
  trialDays?: number;
}

export interface Subscription {
  id: string;
  planId: string;
  plan: SubscriptionPlan;
  status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string;
  trialStart?: string;
  trialEnd?: string;
  nextBillingDate?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank_account';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: string;
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  description: string;
  invoiceDate: string;
  dueDate: string;
  paidAt?: string;
  downloadUrl?: string;
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface CreateSubscriptionData {
  planId: string;
  paymentMethodId?: string;
  couponCode?: string;
}

export interface UpdateSubscriptionData {
  planId?: string;
  paymentMethodId?: string;
}

export interface CreatePaymentMethodData {
  type: 'card' | 'paypal';
  card?: {
    number: string;
    expiryMonth: number;
    expiryYear: number;
    cvc: string;
    name: string;
  };
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  description: string;
  validFrom: string;
  validTo: string;
  maxUses?: number;
  usedCount: number;
  active: boolean;
}

class PaymentService {
  // Subscription plans
  async getPlans(): Promise<SubscriptionPlan[]> {
    const response = await apiService.get<SubscriptionPlan[]>('/billing/plans');
    return response.data;
  }

  async getPlan(planId: string): Promise<SubscriptionPlan> {
    const response = await apiService.get<SubscriptionPlan>(`/billing/plans/${planId}`);
    return response.data;
  }

  // Current subscription
  async getCurrentSubscription(): Promise<Subscription | null> {
    try {
      const response = await apiService.get<Subscription>('/billing/subscription');
      return response.data;
    } catch (error: any) {
      if (error.status === 404) {
        return null; // No active subscription
      }
      throw error;
    }
  }

  async createSubscription(data: CreateSubscriptionData): Promise<{
    subscription: Subscription;
    paymentIntent?: PaymentIntent;
  }> {
    const response = await apiService.post<{
      subscription: Subscription;
      paymentIntent?: PaymentIntent;
    }>('/billing/subscription', data);
    return response.data;
  }

  async updateSubscription(data: UpdateSubscriptionData): Promise<Subscription> {
    const response = await apiService.patch<Subscription>('/billing/subscription', data);
    return response.data;
  }

  async cancelSubscription(cancelAtPeriodEnd = true): Promise<Subscription> {
    const response = await apiService.delete<Subscription>(`/billing/subscription?cancelAtPeriodEnd=${cancelAtPeriodEnd}`);
    return response.data;
  }

  async reactivateSubscription(): Promise<Subscription> {
    const response = await apiService.post<Subscription>('/billing/subscription/reactivate');
    return response.data;
  }

  // Payment methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await apiService.get<PaymentMethod[]>('/billing/payment-methods');
    return response.data;
  }

  async createPaymentMethod(data: CreatePaymentMethodData): Promise<PaymentMethod> {
    const response = await apiService.post<PaymentMethod>('/billing/payment-methods', data);
    return response.data;
  }

  async updatePaymentMethod(paymentMethodId: string, data: Partial<CreatePaymentMethodData>): Promise<PaymentMethod> {
    const response = await apiService.patch<PaymentMethod>(`/billing/payment-methods/${paymentMethodId}`, data);
    return response.data;
  }

  async deletePaymentMethod(paymentMethodId: string): Promise<void> {
    await apiService.delete(`/billing/payment-methods/${paymentMethodId}`);
  }

  async setDefaultPaymentMethod(paymentMethodId: string): Promise<void> {
    await apiService.post(`/billing/payment-methods/${paymentMethodId}/default`);
  }

  // Invoices and billing history
  async getInvoices(): Promise<Invoice[]> {
    const response = await apiService.get<Invoice[]>('/billing/invoices');
    return response.data;
  }

  async getInvoice(invoiceId: string): Promise<Invoice> {
    const response = await apiService.get<Invoice>(`/billing/invoices/${invoiceId}`);
    return response.data;
  }

  async downloadInvoice(invoiceId: string): Promise<Blob> {
    const response = await apiService.get<Blob>(`/billing/invoices/${invoiceId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async retryPayment(invoiceId: string): Promise<PaymentIntent> {
    const response = await apiService.post<PaymentIntent>(`/billing/invoices/${invoiceId}/retry`);
    return response.data;
  }

  // Coupons and discounts
  async validateCoupon(code: string): Promise<Coupon> {
    const response = await apiService.post<Coupon>('/billing/coupons/validate', { code });
    return response.data;
  }

  async applyCoupon(code: string): Promise<{
    coupon: Coupon;
    discount: {
      amount: number;
      percentage?: number;
    };
  }> {
    const response = await apiService.post<{
      coupon: Coupon;
      discount: {
        amount: number;
        percentage?: number;
      };
    }>('/billing/coupons/apply', { code });
    return response.data;
  }

  // Stripe/Payment provider integration
  async createPaymentIntent(amount: number, currency = 'usd'): Promise<PaymentIntent> {
    const response = await apiService.post<PaymentIntent>('/billing/payment-intent', {
      amount,
      currency,
    });
    return response.data;
  }

  async confirmPayment(paymentIntentId: string, paymentMethodId: string): Promise<{
    status: string;
    error?: string;
  }> {
    const response = await apiService.post<{ status: string; error?: string }>('/billing/payment-intent/confirm', {
      paymentIntentId,
      paymentMethodId,
    });
    return response.data;
  }

  // Billing portal (for Stripe)
  async createBillingPortalSession(returnUrl?: string): Promise<{ url: string }> {
    const response = await apiService.post<{ url: string }>('/billing/portal', {
      returnUrl: returnUrl || window.location.origin,
    });
    return response.data;
  }

  // Usage and billing analytics
  async getBillingUsage(): Promise<{
    currentPeriod: {
      start: string;
      end: string;
      daysLeft: number;
    };
    usage: {
      watchTime: number; // in minutes
      downloads: number;
      devices: number;
    };
    limits: {
      maxDevices: number;
      maxDownloads: number;
    };
  }> {
    const response = await apiService.get<{
      currentPeriod: {
        start: string;
        end: string;
        daysLeft: number;
      };
      usage: {
        watchTime: number; // in minutes
        downloads: number;
        devices: number;
      };
      limits: {
        maxDevices: number;
        maxDownloads: number;
      };
    }>('/billing/usage');
    return response.data;
  }

  // Refunds and disputes
  async requestRefund(invoiceId: string, reason: string): Promise<{
    refundId: string;
    status: string;
    amount: number;
  }> {
    const response = await apiService.post<{
      refundId: string;
      status: string;
      amount: number;
    }>(`/billing/invoices/${invoiceId}/refund`, {
      reason,
    });
    return response.data;
  }

  async getRefunds(): Promise<Array<{
    id: string;
    invoiceId: string;
    amount: number;
    reason: string;
    status: 'pending' | 'approved' | 'denied';
    requestedAt: string;
    processedAt?: string;
  }>> {
    const response = await apiService.get<Array<{
      id: string;
      invoiceId: string;
      amount: number;
      reason: string;
      status: 'pending' | 'approved' | 'denied';
      requestedAt: string;
      processedAt?: string;
    }>>('/billing/refunds');
    return response.data;
  }

  // Gift cards and promotions
  async redeemGiftCard(code: string): Promise<{
    value: number;
    currency: string;
    expiresAt?: string;
  }> {
    const response = await apiService.post('/billing/gift-card/redeem', { code });
    return response.data as {
      value: number;
      currency: string;
      expiresAt?: string;
    };
  }

  async getGiftCardBalance(): Promise<{
    balance: number;
    currency: string;
    transactions: Array<{
      id: string;
      type: 'credit' | 'debit';
      amount: number;
      description: string;
      date: string;
    }>;
  }> {
    const response = await apiService.get<{
      balance: number;
      currency: string;
      transactions: Array<{
        id: string;
        type: 'credit' | 'debit';
        amount: number;
        description: string;
        date: string;
      }>;
    }>('/billing/gift-card/balance');
    return response.data;
  }

  // Tax and location
  async updateTaxInformation(data: {
    country: string;
    state?: string;
    taxId?: string;
    businessType?: 'individual' | 'business';
  }): Promise<void> {
    await apiService.post('/billing/tax-info', data);
  }

  async getTaxInformation(): Promise<{
    country: string;
    state?: string;
    taxId?: string;
    businessType?: string;
    taxRate: number;
  }> {
    const response = await apiService.get<{
      country: string;
      state?: string;
      taxId?: string;
      businessType?: string;
      taxRate: number;
    }>('/billing/tax-info');
    return response.data;
  }
}

// Create and export a singleton instance
export const paymentService = new PaymentService();
export default paymentService;