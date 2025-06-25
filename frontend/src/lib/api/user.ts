import { ApiResponse } from "@/types/api";
import { Invoice, PaymentMethod, Subscription, UsageStats, UserProfile, WatchHistoryItem, WatchlistItem } from "@/types/user";
import apiClient from "./client";


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

