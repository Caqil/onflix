import axios, { AxiosError, AxiosResponse } from 'axios';
import {
  LoginCredentials,
  APIResponse,
  RegisterData,
  AuthTokens,
  User,
  PaginatedResponse,
  Content,
  UserProfile,
  VideoQuality,
  ContentVideo
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Go API Response Structures
interface GoAuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

interface GoTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  max_devices: number;
  max_quality: string;
  is_active: boolean;
}

interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  is_default: boolean;
}

interface Invoice {
  id: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: string;
  created: number;
  hosted_invoice_url: string;
  invoice_pdf: string;
}

interface Device {
  id: string;
  name: string;
  type: string;
  os: string;
  last_active: string;
  is_current: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

// Create separate axios instance for refresh (to avoid interceptor loops)
const refreshApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create main axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Response interceptor for error handling with proper refresh logic
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await refreshApiClient.post('/auth/refresh', {
            refresh_token: refreshToken,
          });
          const { access_token } = response.data.data;
          localStorage.setItem('accessToken', access_token);
          
          processQueue(null, access_token);
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        } finally {
          isRefreshing = false;
        }
      } else {
        processQueue(error, null);
        isRefreshing = false;
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ========== AUTHENTICATION API ==========
export const authAPI = {
  // Basic Authentication
  login: (credentials: LoginCredentials) =>
    apiClient.post<APIResponse<GoAuthResponse>>('/auth/login', credentials),
    
  register: (data: RegisterData) =>
    apiClient.post<APIResponse<GoAuthResponse>>('/auth/register', data),
    
  logout: () =>
    apiClient.post<APIResponse>('/auth/logout'),
    
  refreshToken: (refreshToken: string) =>
    refreshApiClient.post<APIResponse<GoTokenResponse>>('/auth/refresh', { 
      refresh_token: refreshToken 
    }),

  // Email Management
  verifyEmail: (token: string) =>
    apiClient.post<APIResponse>('/auth/verify-email', { token }),
    
  resendVerification: (email: string) =>
    apiClient.post<APIResponse>('/auth/resend-verification', { email }),

  // Password Management
  forgotPassword: (email: string) =>
    apiClient.post<APIResponse>('/auth/forgot-password', { email }),
    
  resetPassword: (token: string, password: string) =>
    apiClient.post<APIResponse>('/auth/reset-password', { token, password }),
    
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post<APIResponse>('/auth/change-password', { 
      current_password: currentPassword, 
      new_password: newPassword 
    }),

  // Token Management
  validateToken: () =>
    apiClient.post<APIResponse<User>>('/auth/validate'),

  // Social Authentication
  googleLogin: (token: string) =>
    apiClient.post<APIResponse<GoAuthResponse>>('/auth/google', { token }),
    
  facebookLogin: (token: string) =>
    apiClient.post<APIResponse<GoAuthResponse>>('/auth/facebook', { token }),

  // Two-Factor Authentication
  enable2FA: () =>
    apiClient.post<APIResponse<{ qr_code: string; secret: string; backup_codes: string[] }>>('/auth/2fa/enable'),
    
  verify2FA: (code: string) =>
    apiClient.post<APIResponse>('/auth/2fa/verify', { code }),
    
  disable2FA: () =>
    apiClient.post<APIResponse>('/auth/2fa/disable'),
};

// ========== CONTENT API ==========
export const contentAPI = {
  // Public Content Routes
  browse: (params?: { page?: number; limit?: number; genre?: string; type?: string }) =>
    apiClient.get<PaginatedResponse<Content[]>>('/content', { params }),
    
  getById: (id: string) =>
    apiClient.get<APIResponse<Content>>(`/content/${id}`),
    
  getFeatured: () =>
    apiClient.get<APIResponse<Content[]>>('/content/featured'),
    
  getTrending: () =>
    apiClient.get<APIResponse<Content[]>>('/content/trending'),
    
  getNewReleases: () =>
    apiClient.get<APIResponse<Content[]>>('/content/new-releases'),
    
  getOriginals: () =>
    apiClient.get<APIResponse<Content[]>>('/content/originals'),
    
  getSimilarContent: (id: string, params?: { limit?: number }) =>
    apiClient.get<APIResponse<Content[]>>(`/content/${id}/similar`, { params }),
    
  getTrailers: (id: string) =>
    apiClient.get<APIResponse<any[]>>(`/content/${id}/trailers`),

  // Search
  search: (query: string, params?: { page?: number; limit?: number; type?: string; genre?: string }) =>
    apiClient.get<PaginatedResponse<Content[]>>('/content/search', { 
      params: { q: query, ...params } 
    }),
    
  getSearchSuggestions: (query: string) =>
    apiClient.get<APIResponse<string[]>>('/content/search/suggestions', { 
      params: { q: query } 
    }),

  // Genres and Categories
  getGenres: () =>
    apiClient.get<APIResponse<any[]>>('/content/genres'),
    
  getByGenre: (genre: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Content[]>>(`/content/genres/${genre}`, { params }),
    
  getCategories: () =>
    apiClient.get<APIResponse<any[]>>('/content/categories'),
    
  getByCategory: (category: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Content[]>>(`/content/categories/${category}`, { params }),

  // TV Shows
  getSeasons: (showId: string) =>
    apiClient.get<APIResponse<any[]>>(`/content/tv-shows/${showId}/seasons`),
    
  getSeason: (showId: string, seasonNumber: number) =>
    apiClient.get<APIResponse<any>>(`/content/tv-shows/${showId}/seasons/${seasonNumber}`),
    
  getEpisodes: (showId: string, seasonNumber: number) =>
    apiClient.get<APIResponse<any[]>>(`/content/tv-shows/${showId}/seasons/${seasonNumber}/episodes`),
    
  getEpisode: (showId: string, seasonNumber: number, episodeNumber: number) =>
    apiClient.get<APIResponse<any>>(`/content/tv-shows/${showId}/seasons/${seasonNumber}/episodes/${episodeNumber}`),

  // Protected Content (Requires Subscription)
  stream: (contentId: string) =>
    apiClient.get<APIResponse<{ streaming_url: string; video_info: ContentVideo }>>(`/content/${contentId}/stream`),
    
  streamWithQuality: (contentId: string, quality: VideoQuality) =>
    apiClient.get<APIResponse<{ streaming_url: string; video_info: ContentVideo }>>(`/content/${contentId}/stream/${quality}`),
    
  getStreamingToken: (contentId: string) =>
    apiClient.post<APIResponse<{ token: string; expires_at: string }>>(`/content/${contentId}/stream/token`),
    
  streamEpisode: (showId: string, seasonNumber: number, episodeNumber: number) =>
    apiClient.get<APIResponse<{ streaming_url: string }>>(`/content/tv-shows/${showId}/seasons/${seasonNumber}/episodes/${episodeNumber}/stream`),

  // Downloads
  downloadContent: (contentId: string, quality?: string) =>
    apiClient.post<APIResponse<any>>(`/content/${contentId}/download`, { quality }),
    
  getDownloads: () =>
    apiClient.get<APIResponse<any[]>>('/content/downloads'),
    
  removeDownload: (downloadId: string) =>
    apiClient.delete<APIResponse>(`/content/downloads/${downloadId}`),

  // Subtitles
  getSubtitles: (contentId: string) =>
    apiClient.get<APIResponse<any[]>>(`/content/${contentId}/subtitles`),
    
  getSubtitleFile: (contentId: string, language: string) =>
    apiClient.get<any>(`/content/${contentId}/subtitles/${language}`),

  // User Interactions
  likeContent: (contentId: string) =>
    apiClient.post<APIResponse>(`/content/${contentId}/like`),
    
  unlikeContent: (contentId: string) =>
    apiClient.delete<APIResponse>(`/content/${contentId}/like`),
    
  rateContent: (contentId: string, rating: number) =>
    apiClient.post<APIResponse>(`/content/${contentId}/rate`, { rating }),
    
  addReview: (contentId: string, review: { title?: string; comment: string; rating: number }) =>
    apiClient.post<APIResponse>(`/content/${contentId}/review`, review),
    
  getReviews: (contentId: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<any[]>>(`/content/${contentId}/reviews`, { params }),

  // Continue Watching
  getContinueWatching: () =>
    apiClient.get<APIResponse<Content[]>>('/content/continue-watching'),
    
  updateWatchProgress: (contentId: string, progress: number, duration: number) =>
    apiClient.post<APIResponse>(`/content/${contentId}/watch-progress`, { 
      progress, 
      duration 
    }),
};

// ========== RECOMMENDATIONS API ==========
export const recommendationsAPI = {
  getRecommendations: () =>
    apiClient.get<APIResponse<Content[]>>('/recommendations'),
    
  getTrendingRecommendations: () =>
    apiClient.get<APIResponse<Content[]>>('/recommendations/trending'),
    
  getBecauseYouWatchedRecommendations: (contentId: string) =>
    apiClient.get<APIResponse<Content[]>>(`/recommendations/because-you-watched/${contentId}`),
    
  submitRecommendationFeedback: (feedback: { 
    recommendation_id: string; 
    feedback: 'like' | 'dislike' | 'not_interested' 
  }) =>
    apiClient.post<APIResponse>('/recommendations/feedback', feedback),
};

// ========== USER API ==========
export const userAPI = {
  // Profile Management
  getProfile: () =>
    apiClient.get<APIResponse<User>>('/user/profile'),
    
  updateProfile: (data: Partial<UserProfile>) =>
    apiClient.put<APIResponse<User>>('/user/profile', data),

  // Subscription Management
  getSubscription: () =>
    apiClient.get<APIResponse<any>>('/user/subscription'),
    
  createSubscription: (planId: string, paymentMethodId: string) =>
    apiClient.post<APIResponse<any>>('/user/subscription', { 
      plan_id: planId, 
      payment_method_id: paymentMethodId 
    }),
    
  updateSubscription: (planId: string) =>
    apiClient.put<APIResponse>('/user/subscription', { plan_id: planId }),
    
  cancelSubscription: () =>
    apiClient.post<APIResponse>('/user/subscription/cancel'),
    
  pauseSubscription: () =>
    apiClient.post<APIResponse>('/user/subscription/pause'),
    
  resumeSubscription: () =>
    apiClient.post<APIResponse>('/user/subscription/resume'),
    
  getInvoices: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Invoice[]>>('/user/subscription/invoices', { params }),
    
  getUsage: () =>
    apiClient.get<APIResponse<any>>('/user/subscription/usage'),

  // Payment Methods
  getPaymentMethods: () =>
    apiClient.get<APIResponse<PaymentMethod[]>>('/user/payment/methods'),
    
  addPaymentMethod: (paymentMethodId: string) =>
    apiClient.post<APIResponse>('/user/payment/methods', { payment_method_id: paymentMethodId }),
    
  removePaymentMethod: (methodId: string) =>
    apiClient.delete<APIResponse>(`/user/payment/methods/${methodId}`),
    
  setDefaultPaymentMethod: (methodId: string) =>
    apiClient.put<APIResponse>(`/user/payment/methods/${methodId}/default`),

  // Watchlist Management
  getWatchlist: (profileId: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<APIResponse<Content[]>>('/user/watchlist', { 
      params: { profile_id: profileId, ...params } 
    }),
    
  addToWatchlist: (contentId: string, profileId: string) =>
    apiClient.post<APIResponse>(`/user/watchlist/${contentId}`, null, { 
      params: { profile_id: profileId } 
    }),
    
  removeFromWatchlist: (contentId: string, profileId: string) =>
    apiClient.delete<APIResponse>(`/user/watchlist/${contentId}`, { 
      params: { profile_id: profileId } 
    }),
    
  clearWatchlist: (profileId: string) =>
    apiClient.post<APIResponse>('/user/watchlist/clear', null, { 
      params: { profile_id: profileId } 
    }),

  // Watch History
  getWatchHistory: (profileId: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<APIResponse<any[]>>('/user/history', { 
      params: { profile_id: profileId, ...params } 
    }),
    
  updateWatchProgress: (data: { 
    content_id: string; 
    profile_id: string; 
    progress: number; 
    duration: number; 
  }) =>
    apiClient.post<APIResponse>('/user/history/progress', data),
    
  removeFromHistory: (contentId: string, profileId: string) =>
    apiClient.delete<APIResponse>(`/user/history/${contentId}`, { 
      params: { profile_id: profileId } 
    }),
    
  clearWatchHistory: (profileId: string) =>
    apiClient.post<APIResponse>('/user/history/clear', null, { 
      params: { profile_id: profileId } 
    }),

  // Preferences
  getPreferences: () =>
    apiClient.get<APIResponse<any>>('/user/preferences'),
    
  updatePreferences: (preferences: any) =>
    apiClient.put<APIResponse>('/user/preferences', preferences),
    
  updateLanguage: (language: string) =>
    apiClient.put<APIResponse>('/user/preferences/language', { language }),
    
  updateMaturityRating: (maturityRating: string) =>
    apiClient.put<APIResponse>('/user/preferences/maturity-rating', { 
      maturity_rating: maturityRating 
    }),

  // Device Management
  getDevices: () =>
    apiClient.get<APIResponse<Device[]>>('/user/devices'),
    
  registerDevice: (device: { name: string; type: string; os: string; user_agent: string }) =>
    apiClient.post<APIResponse<Device>>('/user/devices/register', device),
    
  removeDevice: (deviceId: string) =>
    apiClient.delete<APIResponse>(`/user/devices/${deviceId}`),
    
  logoutAllDevices: () =>
    apiClient.post<APIResponse>('/user/devices/logout-all'),

  // Notifications
  getNotifications: () =>
    apiClient.get<APIResponse<Notification[]>>('/user/notifications'),
    
  markNotificationAsRead: (notificationId: string) =>
    apiClient.put<APIResponse>(`/user/notifications/${notificationId}/read`),
    
  markAllNotificationsAsRead: () =>
    apiClient.post<APIResponse>('/user/notifications/mark-all-read'),
    
  deleteNotification: (notificationId: string) =>
    apiClient.delete<APIResponse>(`/user/notifications/${notificationId}`),
};

// ========== ADMIN API ==========
export const adminAPI = {
  // Dashboard and Analytics
  getDashboard: () =>
    apiClient.get<APIResponse<any>>('/admin/dashboard'),
    
  getAnalytics: () =>
    apiClient.get<APIResponse<any>>('/admin/analytics'),
    
  getUserAnalytics: (timeRange: string) =>
    apiClient.get<APIResponse<any>>('/admin/analytics/users', { params: { timeRange } }),
    
  getContentAnalytics: (timeRange: string) =>
    apiClient.get<APIResponse<any>>('/admin/analytics/content', { params: { timeRange } }),
    
  getRevenueAnalytics: (timeRange: string) =>
    apiClient.get<APIResponse<any>>('/admin/analytics/revenue', { params: { timeRange } }),

  // User Management
  getUsers: (params?: { page?: number; limit?: number; role?: string }) =>
    apiClient.get<PaginatedResponse<User[]>>('/admin/users', { params }),
    
  getUserById: (id: string) =>
    apiClient.get<APIResponse<User>>(`/admin/users/${id}`),
    
  updateUser: (id: string, data: Partial<User>) =>
    apiClient.put<APIResponse<User>>(`/admin/users/${id}`, data),
    
  deleteUser: (id: string) =>
    apiClient.delete<APIResponse>(`/admin/users/${id}`),
    
  banUser: (id: string, reason: string) =>
    apiClient.post<APIResponse>(`/admin/users/${id}/ban`, { reason }),
    
  unbanUser: (id: string) =>
    apiClient.post<APIResponse>(`/admin/users/${id}/unban`),
    
  resetUserPassword: (id: string) =>
    apiClient.post<APIResponse>(`/admin/users/${id}/reset-password`),
    
  getUserSubscription: (id: string) =>
    apiClient.get<APIResponse<any>>(`/admin/users/${id}/subscription`),
    
  updateUserSubscription: (id: string, data: any) =>
    apiClient.put<APIResponse>(`/admin/users/${id}/subscription`, data),
    
  getUserActivity: (id: string) =>
    apiClient.get<APIResponse<any>>(`/admin/users/${id}/activity`),

  // Content Management
  getAllContent: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<PaginatedResponse<Content[]>>('/admin/content', { params }),
    
  createContent: (data: FormData) =>
    apiClient.post<APIResponse<Content>>('/admin/content', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    
  getContentDetails: (id: string) =>
    apiClient.get<APIResponse<Content>>(`/admin/content/${id}`),
    
  updateContent: (id: string, data: Partial<Content>) =>
    apiClient.put<APIResponse<Content>>(`/admin/content/${id}`, data),
    
  deleteContent: (id: string) =>
    apiClient.delete<APIResponse>(`/admin/content/${id}`),
    
  publishContent: (id: string) =>
    apiClient.post<APIResponse>(`/admin/content/${id}/publish`),
    
  unpublishContent: (id: string) =>
    apiClient.post<APIResponse>(`/admin/content/${id}/unpublish`),

  // TMDB Integration
  importFromTMDB: (tmdbId: string) =>
    apiClient.post<APIResponse<Content>>(`/admin/content/import/tmdb/${tmdbId}`),
    
  syncWithTMDB: () =>
    apiClient.post<APIResponse>('/admin/content/sync/tmdb'),
    
  searchTMDB: (query: string) =>
    apiClient.get<APIResponse<any[]>>('/admin/content/tmdb/search', { 
      params: { query } 
    }),

  // Video Management
  uploadVideo: (contentId: string, videoData: FormData) =>
    apiClient.post<APIResponse<any>>(`/admin/content/${contentId}/videos`, videoData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    
  getVideos: (contentId: string) =>
    apiClient.get<APIResponse<any[]>>(`/admin/content/${contentId}/videos`),
    
  updateVideo: (contentId: string, videoId: string, data: any) =>
    apiClient.put<APIResponse>(`/admin/content/${contentId}/videos/${videoId}`, data),
    
  deleteVideo: (contentId: string, videoId: string) =>
    apiClient.delete<APIResponse>(`/admin/content/${contentId}/videos/${videoId}`),
    
  processVideo: (contentId: string, videoId: string) =>
    apiClient.post<APIResponse<any>>(`/admin/content/${contentId}/videos/${videoId}/process`),

  // Season and Episode Management
  createSeason: (contentId: string, seasonData: any) =>
    apiClient.post<APIResponse<any>>(`/admin/content/${contentId}/seasons`, seasonData),
    
  getSeasons: (contentId: string) =>
    apiClient.get<APIResponse<any[]>>(`/admin/content/${contentId}/seasons`),
    
  updateSeason: (contentId: string, seasonId: string, data: any) =>
    apiClient.put<APIResponse>(`/admin/content/${contentId}/seasons/${seasonId}`, data),
    
  deleteSeason: (contentId: string, seasonId: string) =>
    apiClient.delete<APIResponse>(`/admin/content/${contentId}/seasons/${seasonId}`),
    
  createEpisode: (contentId: string, seasonId: string, episodeData: any) =>
    apiClient.post<APIResponse<any>>(`/admin/content/${contentId}/seasons/${seasonId}/episodes`, episodeData),
    
  getEpisodes: (contentId: string, seasonId: string) =>
    apiClient.get<APIResponse<any[]>>(`/admin/content/${contentId}/seasons/${seasonId}/episodes`),
    
  updateEpisode: (contentId: string, seasonId: string, episodeId: string, data: any) =>
    apiClient.put<APIResponse>(`/admin/content/${contentId}/seasons/${seasonId}/episodes/${episodeId}`, data),
    
  deleteEpisode: (contentId: string, seasonId: string, episodeId: string) =>
    apiClient.delete<APIResponse>(`/admin/content/${contentId}/seasons/${seasonId}/episodes/${episodeId}`),

  // Subtitle Management
  uploadSubtitle: (contentId: string, subtitleData: FormData) =>
    apiClient.post<APIResponse<any>>(`/admin/content/${contentId}/subtitles`, subtitleData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    
  getSubtitles: (contentId: string) =>
    apiClient.get<APIResponse<any[]>>(`/admin/content/${contentId}/subtitles`),
    
  deleteSubtitle: (contentId: string, subtitleId: string) =>
    apiClient.delete<APIResponse>(`/admin/content/${contentId}/subtitles/${subtitleId}`),

  // Content Moderation
  getReportedContent: () =>
    apiClient.get<APIResponse<any[]>>('/admin/content/moderation/reported'),
    
  approveContent: (contentId: string) =>
    apiClient.post<APIResponse>(`/admin/content/moderation/${contentId}/approve`),
    
  rejectContent: (contentId: string) =>
    apiClient.post<APIResponse>(`/admin/content/moderation/${contentId}/reject`),

  // Subscription Plan Management
  getSubscriptionPlans: () =>
    apiClient.get<APIResponse<SubscriptionPlan[]>>('/admin/plans'),
    
  createSubscriptionPlan: (planData: Partial<SubscriptionPlan>) =>
    apiClient.post<APIResponse<SubscriptionPlan>>('/admin/plans', planData),
    
  getSubscriptionPlan: (planId: string) =>
    apiClient.get<APIResponse<SubscriptionPlan>>(`/admin/plans/${planId}`),
    
  updateSubscriptionPlan: (planId: string, data: Partial<SubscriptionPlan>) =>
    apiClient.put<APIResponse<SubscriptionPlan>>(`/admin/plans/${planId}`, data),
    
  deleteSubscriptionPlan: (planId: string) =>
    apiClient.delete<APIResponse>(`/admin/plans/${planId}`),
    
  activateSubscriptionPlan: (planId: string) =>
    apiClient.post<APIResponse>(`/admin/plans/${planId}/activate`),
    
  deactivateSubscriptionPlan: (planId: string) =>
    apiClient.post<APIResponse>(`/admin/plans/${planId}/deactivate`),

  // Subscription Management
  getSubscriptions: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<any[]>>('/admin/subscriptions', { params }),
    
  getSubscription: (subscriptionId: string) =>
    apiClient.get<APIResponse<any>>(`/admin/subscriptions/${subscriptionId}`),
    
  updateSubscription: (subscriptionId: string, data: any) =>
    apiClient.put<APIResponse>(`/admin/subscriptions/${subscriptionId}`, data),
    
  cancelSubscription: (subscriptionId: string) =>
    apiClient.post<APIResponse>(`/admin/subscriptions/${subscriptionId}/cancel`),
    
  refundSubscription: (subscriptionId: string) =>
    apiClient.post<APIResponse>(`/admin/subscriptions/${subscriptionId}/refund`),
    
  getSubscriptionAnalytics: () =>
    apiClient.get<APIResponse<any>>('/admin/subscriptions/analytics'),

  // Payment Management
  getPayments: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<any[]>>('/admin/payments', { params }),
    
  getPayment: (paymentId: string) =>
    apiClient.get<APIResponse<any>>(`/admin/payments/${paymentId}`),
    
  refundPayment: (paymentId: string, data: { amount?: number; reason?: string }) =>
    apiClient.post<APIResponse<any>>(`/admin/payments/${paymentId}/refund`, data),
    
  getFailedPayments: () =>
    apiClient.get<APIResponse<any[]>>('/admin/payments/failed'),
    
  retryPayment: (paymentId: string) =>
    apiClient.post<APIResponse>(`/admin/payments/${paymentId}/retry`),

  // System Settings
  getSettings: () =>
    apiClient.get<APIResponse<any>>('/admin/settings'),
    
  updateSettings: (settings: any) =>
    apiClient.put<APIResponse>('/admin/settings', settings),
    
  getTMDBSettings: () =>
    apiClient.get<APIResponse<any>>('/admin/settings/tmdb'),
    
  updateTMDBSettings: (settings: any) =>
    apiClient.put<APIResponse>('/admin/settings/tmdb', settings),
    
  getStripeSettings: () =>
    apiClient.get<APIResponse<any>>('/admin/settings/stripe'),
    
  updateStripeSettings: (settings: any) =>
    apiClient.put<APIResponse>('/admin/settings/stripe', settings),
    
  getEmailSettings: () =>
    apiClient.get<APIResponse<any>>('/admin/settings/email'),
    
  updateEmailSettings: (settings: any) =>
    apiClient.put<APIResponse>('/admin/settings/email', settings),

  // System Monitoring
  getSystemHealth: () =>
    apiClient.get<APIResponse<any>>('/admin/system/health'),
    
  getLogs: (params?: { level?: string; limit?: number }) =>
    apiClient.get<APIResponse<any[]>>('/admin/system/logs', { params }),
    
  getMetrics: () =>
    apiClient.get<APIResponse<any>>('/admin/system/metrics'),
    
  clearCache: () =>
    apiClient.post<APIResponse>('/admin/system/cache/clear'),
    
  backupDatabase: () =>
    apiClient.post<APIResponse>('/admin/system/database/backup'),
    
  getDatabaseStatus: () =>
    apiClient.get<APIResponse<any>>('/admin/system/database/status'),

  // Reports
  getUserReport: () =>
    apiClient.get<APIResponse<any>>('/admin/reports/users'),
    
  getContentReport: () =>
    apiClient.get<APIResponse<any>>('/admin/reports/content'),
    
  getRevenueReport: () =>
    apiClient.get<APIResponse<any>>('/admin/reports/revenue'),
    
  getEngagementReport: () =>
    apiClient.get<APIResponse<any>>('/admin/reports/engagement'),
    
  generateCustomReport: (reportData: any) =>
    apiClient.post<APIResponse<any>>('/admin/reports/custom', reportData),
    
  exportReport: (reportId: string) =>
    apiClient.get(`/admin/reports/export/${reportId}`, { responseType: 'blob' }),

  // Admin Notifications
  getNotifications: () =>
    apiClient.get<APIResponse<Notification[]>>('/admin/notifications'),
    
  createNotification: (notification: any) =>
    apiClient.post<APIResponse<Notification>>('/admin/notifications', notification),
    
  updateNotification: (notificationId: string, data: any) =>
    apiClient.put<APIResponse<Notification>>(`/admin/notifications/${notificationId}`, data),
    
  deleteNotification: (notificationId: string) =>
    apiClient.delete<APIResponse>(`/admin/notifications/${notificationId}`),
    
  broadcastNotification: (notification: any) =>
    apiClient.post<APIResponse<any>>('/admin/notifications/broadcast', notification),

  // Recommendation Management
  getRecommendationAlgorithm: () =>
    apiClient.get<APIResponse<any>>('/admin/recommendations/algorithm'),
    
  updateRecommendationAlgorithm: (algorithm: any) =>
    apiClient.put<APIResponse>('/admin/recommendations/algorithm', algorithm),
    
  retrainRecommendationModel: () =>
    apiClient.post<APIResponse>('/admin/recommendations/retrain'),
    
  getRecommendationPerformance: () =>
    apiClient.get<APIResponse<any>>('/admin/recommendations/performance'),
};

// ========== WEBHOOK HANDLERS ==========
export const webhookAPI = {
  stripeWebhook: (data: any, signature: string) =>
    axios.post('/webhooks/stripe', data, {
      headers: { 'Stripe-Signature': signature }
    }),
    
  tmdbWebhook: (data: any) =>
    axios.post('/webhooks/tmdb', data),
    
  paymentWebhook: (provider: string, data: any) =>
    axios.post(`/webhooks/payment/${provider}`, data),
};

export default apiClient;