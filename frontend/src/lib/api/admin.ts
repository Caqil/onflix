import apiClient, { ApiResponse } from './client';
import { User } from './auth';
import { Content } from './content';

export interface DashboardStats {
  total_users: number;
  active_subscriptions: number;
  total_content: number;
  monthly_revenue: number;
  recent_signups: number;
}

export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  subscription_status: string;
  created_at: string;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  role?: 'user' | 'admin';
  status?: 'active' | 'inactive' | 'banned';
  search?: string;
}

export interface CreateContentRequest {
  title: string;
  description: string;
  type: 'movie' | 'tv_show';
  genre: string[];
  release_date: string;
  duration?: number;
  poster_url: string;
  video_url?: string;
  backdrop_url?: string;
  cast?: string[];
  director?: string;
  trailer_url?: string;
}

export interface UpdateContentRequest {
  title?: string;
  description?: string;
  genre?: string[];
  release_date?: string;
  duration?: number;
  poster_url?: string;
  video_url?: string;
  backdrop_url?: string;
  cast?: string[];
  director?: string;
  trailer_url?: string;
  status?: 'draft' | 'published' | 'archived';
}

export interface BanUserRequest {
  reason: string;
  duration?: number; // days, 0 for permanent
}

export interface ContentAnalytics {
  content_id: string;
  title: string;
  views: number;
  watch_time: number;
  completion_rate: number;
  rating: number;
  revenue: number;
}

export interface RevenueStats {
  total_revenue: number;
  monthly_revenue: number;
  subscription_revenue: number;
  average_revenue_per_user: number;
  revenue_growth: number;
}

export interface PlatformSettings {
  general: {
    site_name: string;
    site_description: string;
    maintenance_mode: boolean;
    registration_enabled: boolean;
  };
  streaming: {
    max_quality: string;
    concurrent_streams: number;
    download_enabled: boolean;
    offline_viewing_days: number;
  };
  payments: {
    currency: string;
    tax_rate: number;
    trial_period_days: number;
  };
}

class AdminAPI {
  // Dashboard
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return apiClient.get('/api/v1/admin/dashboard');
  }

  // User Management
  async getUsers(filters?: UserFilters): Promise<ApiResponse<AdminUser[]>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return apiClient.get(`/api/v1/admin/users?${params.toString()}`);
  }

  async getUserById(userId: string): Promise<ApiResponse<AdminUser>> {
    return apiClient.get(`/api/v1/admin/users/${userId}`);
  }

  async updateUser(userId: string, data: Partial<AdminUser>): Promise<ApiResponse<AdminUser>> {
    return apiClient.put(`/api/v1/admin/users/${userId}`, data);
  }

  async banUser(userId: string, data: BanUserRequest): Promise<ApiResponse> {
    return apiClient.post(`/api/v1/admin/users/${userId}/ban`, data);
  }

  async unbanUser(userId: string): Promise<ApiResponse> {
    return apiClient.post(`/api/v1/admin/users/${userId}/unban`);
  }

  async deleteUser(userId: string): Promise<ApiResponse> {
    return apiClient.delete(`/api/v1/admin/users/${userId}`);
  }

  // Content Management
  async getAdminContent(filters?: any): Promise<ApiResponse<Content[]>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return apiClient.get(`/api/v1/admin/content?${params.toString()}`);
  }

  async createContent(data: CreateContentRequest): Promise<ApiResponse<Content>> {
    return apiClient.post('/api/v1/admin/content', data);
  }

  async updateContent(contentId: string, data: UpdateContentRequest): Promise<ApiResponse<Content>> {
    return apiClient.put(`/api/v1/admin/content/${contentId}`, data);
  }

  async deleteContent(contentId: string): Promise<ApiResponse> {
    return apiClient.delete(`/api/v1/admin/content/${contentId}`);
  }

  async getContentAnalytics(contentId: string): Promise<ApiResponse<ContentAnalytics>> {
    return apiClient.get(`/api/v1/admin/content/${contentId}/analytics`);
  }

  async uploadContent(file: File, onProgress?: (progress: number) => void): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.upload('/api/v1/admin/content/upload', formData, onProgress);
  }

  // Subscription Management
  async getSubscriptions(page = 1, limit = 20): Promise<ApiResponse<any[]>> {
    return apiClient.get(`/api/v1/admin/subscriptions?page=${page}&limit=${limit}`);
  }

  async cancelUserSubscription(userId: string, reason?: string): Promise<ApiResponse> {
    return apiClient.post(`/api/v1/admin/users/${userId}/subscription/cancel`, { reason });
  }

  async refundPayment(paymentId: string, amount?: number): Promise<ApiResponse> {
    return apiClient.post(`/api/v1/admin/payments/${paymentId}/refund`, { amount });
  }

  // Analytics
  async getRevenueStats(period?: 'day' | 'week' | 'month' | 'year'): Promise<ApiResponse<RevenueStats>> {
    const params = period ? `?period=${period}` : '';
    return apiClient.get(`/api/v1/admin/analytics/revenue${params}`);
  }

  async getUserGrowthStats(period?: 'day' | 'week' | 'month' | 'year'): Promise<ApiResponse<any>> {
    const params = period ? `?period=${period}` : '';
    return apiClient.get(`/api/v1/admin/analytics/users${params}`);
  }

  async getContentPerformance(period?: 'day' | 'week' | 'month' | 'year'): Promise<ApiResponse<ContentAnalytics[]>> {
    const params = period ? `?period=${period}` : '';
    return apiClient.get(`/api/v1/admin/analytics/content${params}`);
  }

  async getStreamingStats(): Promise<ApiResponse<any>> {
    return apiClient.get('/api/v1/admin/analytics/streaming');
  }

  // Platform Settings
  async getSettings(): Promise<ApiResponse<PlatformSettings>> {
    return apiClient.get('/api/v1/admin/settings');
  }

  async updateSettings(settings: Partial<PlatformSettings>): Promise<ApiResponse<PlatformSettings>> {
    return apiClient.put('/api/v1/admin/settings', settings);
  }

  // Reports
  async exportUsers(format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const response = await apiClient.get(`/api/v1/admin/reports/users?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async exportRevenue(period: 'month' | 'quarter' | 'year', format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const response = await apiClient.get(`/api/v1/admin/reports/revenue?period=${period}&format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  }
}

const adminAPI = new AdminAPI();
export default adminAPI;


