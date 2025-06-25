import apiClient, { ApiResponse } from './client';
import { User } from './auth';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  created_at: string;
  subscription_status: string;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

export interface Subscription {
  id: string;
  plan: string;
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string;
}

export interface CreateSubscriptionRequest {
  plan_id: string;
  payment_method_id: string;
}

export interface UpdateSubscriptionRequest {
  plan_id: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  is_default: boolean;
}

export interface AddPaymentMethodRequest {
  payment_method_id: string;
}

export interface Invoice {
  id: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: string;
  created: number;
  hosted_invoice_url: string;
  invoice_pdf: string;
}

export interface UsageStats {
  total_watch_time: number;
  content_watched: number;
  downloads_used: number;
  simultaneous_streams: number;
  bandwidth_used: string;
}

export interface WatchlistItem {
  id: string;
  title: string;
  type: 'movie' | 'tv_show';
  poster_url: string;
  added_at: string;
}

export interface WatchHistoryItem {
  content_id: string;
  title: string;
  progress: number;
  duration: number;
  last_watched: string;
}

class UserAPI {
  // Profile Management
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return apiClient.get('/api/v1/user/profile');
  }

  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<UserProfile>> {
    return apiClient.put('/api/v1/user/profile', data);
  }

  // Subscription Management
  async getSubscription(): Promise<ApiResponse<Subscription>> {
    return apiClient.get('/api/v1/user/subscription');
  }

  async createSubscription(data: CreateSubscriptionRequest): Promise<ApiResponse<Subscription>> {
    return apiClient.post('/api/v1/user/subscription', data);
  }

  async updateSubscription(data: UpdateSubscriptionRequest): Promise<ApiResponse> {
    return apiClient.put('/api/v1/user/subscription', data);
  }

  async cancelSubscription(): Promise<ApiResponse> {
    return apiClient.post('/api/v1/user/subscription/cancel');
  }

  async pauseSubscription(): Promise<ApiResponse> {
    return apiClient.post('/api/v1/user/subscription/pause');
  }

  async resumeSubscription(): Promise<ApiResponse> {
    return apiClient.post('/api/v1/user/subscription/resume');
  }

  // Payment Management
  async getPaymentMethods(): Promise<ApiResponse<PaymentMethod[]>> {
    return apiClient.get('/api/v1/user/payment/methods');
  }

  async addPaymentMethod(data: AddPaymentMethodRequest): Promise<ApiResponse> {
    return apiClient.post('/api/v1/user/payment/methods', data);
  }

  async setDefaultPaymentMethod(paymentMethodId: string): Promise<ApiResponse> {
    return apiClient.put(`/api/v1/user/payment/methods/${paymentMethodId}/default`);
  }

  async removePaymentMethod(paymentMethodId: string): Promise<ApiResponse> {
    return apiClient.delete(`/api/v1/user/payment/methods/${paymentMethodId}`);
  }

  async getInvoices(page = 1, limit = 20): Promise<ApiResponse<Invoice[]>> {
    return apiClient.get(`/api/v1/user/subscription/invoices?page=${page}&limit=${limit}`);
  }

  async getUsageStats(): Promise<ApiResponse<UsageStats>> {
    return apiClient.get('/api/v1/user/subscription/usage');
  }

  // Watchlist Management
  async getWatchlist(profileId?: string): Promise<ApiResponse<WatchlistItem[]>> {
    const params = profileId ? `?profile_id=${profileId}` : '';
    return apiClient.get(`/api/v1/user/watchlist${params}`);
  }

  async addToWatchlist(contentId: string, profileId?: string): Promise<ApiResponse> {
    const params = profileId ? `?profile_id=${profileId}` : '';
    return apiClient.post(`/api/v1/user/watchlist/${contentId}${params}`);
  }

  async removeFromWatchlist(contentId: string, profileId?: string): Promise<ApiResponse> {
    const params = profileId ? `?profile_id=${profileId}` : '';
    return apiClient.delete(`/api/v1/user/watchlist/${contentId}${params}`);
  }

  // Watch History
  async getWatchHistory(profileId?: string): Promise<ApiResponse<WatchHistoryItem[]>> {
    const params = profileId ? `?profile_id=${profileId}` : '';
    return apiClient.get(`/api/v1/user/history${params}`);
  }

  async clearWatchHistory(profileId?: string): Promise<ApiResponse> {
    const params = profileId ? `?profile_id=${profileId}` : '';
    return apiClient.delete(`/api/v1/user/history${params}`);
  }
}

const userAPI = new UserAPI();
export default userAPI;

