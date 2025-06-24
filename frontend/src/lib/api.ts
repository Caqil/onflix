import axios, { AxiosError, AxiosResponse } from 'axios';
// Add this import to fix the TypeScript errors
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

// Go API Auth Response Structure (matches your backend)
interface GoAuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

// Go API Token Response Structure
interface GoTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: string;
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
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Response interceptor for error handling (FIXED to prevent infinite loops)
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (originalRequest) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          }
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        // No refresh token, clear auth and redirect
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        processQueue(error, null);
        isRefreshing = false;
        
        // Only redirect if not already on login page
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        // Use separate axios instance for refresh to avoid interceptor loop
        const response = await refreshApiClient.post('/auth/refresh', {
          refresh_token: refreshToken, // Use correct field name for Go backend
        });

        const { access_token, refresh_token } = response.data.data;
        
        // Update tokens
        localStorage.setItem('accessToken', access_token);
        if (refresh_token) {
          localStorage.setItem('refreshToken', refresh_token);
        }

        // Update the authorization header for the original request
        if (originalRequest) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        processQueue(null, access_token);
        isRefreshing = false;

        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear auth and redirect
        processQueue(refreshError, null);
        isRefreshing = false;
        
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        // Only redirect if not already on login page
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API functions - Updated to match Go backend response structure
export const authAPI = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<APIResponse<GoAuthResponse>>('/auth/login', credentials),
    
  register: (data: RegisterData) =>  // ← Uses RegisterData (backend format)
    apiClient.post<APIResponse<GoAuthResponse>>('/auth/register', data),
    
  logout: () =>
    apiClient.post<APIResponse>('/auth/logout'),
    
  refreshToken: (refreshToken: string) =>
    refreshApiClient.post<APIResponse<GoTokenResponse>>('/auth/refresh', { 
      refresh_token: refreshToken 
    }),
    
  forgotPassword: (email: string) =>
    apiClient.post<APIResponse>('/auth/forgot-password', { email }),
    
  resetPassword: (token: string, password: string) =>
    apiClient.post<APIResponse>('/auth/reset-password', { token, password }),
    
  verifyEmail: (token: string) =>
    apiClient.post<APIResponse>('/auth/verify-email', { token }),
    
  resendVerification: (email: string) =>
    apiClient.post<APIResponse>('/auth/resend-verification', { email }),
    
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post<APIResponse>('/auth/change-password', { 
      current_password: currentPassword, 
      new_password: newPassword 
    }),
    
  validateToken: () =>
    apiClient.post<APIResponse<User>>('/auth/validate'),
};

// Content API - Based on actual Go backend routes
export const contentAPI = {
  // Public content routes (no auth required)
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
    
  // Search (requires "q" parameter, not "query")
  search: (query: string, params?: { page?: number; limit?: number; type?: string; genre?: string }) =>
    apiClient.get<PaginatedResponse<Content[]>>('/content/search', { 
      params: { q: query, ...params } 
    }),
    
  getSearchSuggestions: (query: string) =>
    apiClient.get<APIResponse<string[]>>('/content/search/suggestions', { 
      params: { q: query } 
    }),
    
  // Genres and categories
  getGenres: () =>
    apiClient.get<APIResponse<{ genre: string; count: number }[]>>('/content/genres'),
    
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
    
  // Streaming endpoints (require subscription)
  stream: (contentId: string) =>
    apiClient.get<APIResponse<{ streaming_url: string; video_info: ContentVideo }>>(`/content/${contentId}/stream`),
    
  streamWithQuality: (contentId: string, quality: VideoQuality) =>
    apiClient.get<APIResponse<{ streaming_url: string; video_info: ContentVideo }>>(`/content/${contentId}/stream/${quality}`),
    
  getStreamingToken: (contentId: string) =>
    apiClient.post<APIResponse<{ token: string; expires_at: string }>>(`/content/${contentId}/stream/token`),
    
  streamEpisode: (showId: string, seasonNumber: number, episodeNumber: number) =>
    apiClient.get<APIResponse<{ streaming_url: string }>>(`/content/tv-shows/${showId}/seasons/${seasonNumber}/episodes/${episodeNumber}/stream`),
    
  // Downloads (require subscription)
  downloadContent: (contentId: string) =>
    apiClient.post<APIResponse<any>>(`/content/${contentId}/download`),
    
  getDownloads: () =>
    apiClient.get<APIResponse<any[]>>('/content/downloads'),
    
  removeDownload: (downloadId: string) =>
    apiClient.delete<APIResponse>(`/content/downloads/${downloadId}`),
    
  // Subtitles
  getSubtitles: (contentId: string) =>
    apiClient.get<APIResponse<any[]>>(`/content/${contentId}/subtitles`),
    
  getSubtitleFile: (contentId: string, language: string) =>
    apiClient.get<any>(`/content/${contentId}/subtitles/${language}`),
    
  // User interactions (require auth)
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
    
  // Continue watching and progress
  getContinueWatching: () =>
    apiClient.get<APIResponse<Content[]>>('/content/continue-watching'),
    
  updateWatchProgress: (contentId: string, progress: number, duration: number) =>
    apiClient.post<APIResponse>(`/content/${contentId}/watch-progress`, { 
      progress, 
      duration 
    }),
};

// Recommendations API (separate routes)
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

// User API - Based on actual Go backend routes
export const userAPI = {
  // Profile management
  getProfile: () =>
    apiClient.get<APIResponse<User>>('/user/profile'),
    
  updateProfile: (data: Partial<UserProfile>) =>
    apiClient.put<APIResponse<User>>('/user/profile', data),
    
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.put<APIResponse>('/user/change-password', { 
      current_password: currentPassword, 
      new_password: newPassword 
    }),
    
  // Watchlist management (requires profile_id query param)
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
    
  // Watch history (requires profile_id query param)
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
    apiClient.put<APIResponse>('/user/preferences/maturity-rating', { maturity_rating: maturityRating }),
};

// Admin API
export const adminAPI = {
  // Content management
  getContent: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<PaginatedResponse<Content[]>>('/admin/content', { params }),
    
  createContent: (data: Partial<Content>) =>
    apiClient.post<APIResponse<Content>>('/admin/content', data),
    
  updateContent: (id: string, data: Partial<Content>) =>
    apiClient.put<APIResponse<Content>>(`/admin/content/${id}`, data),
    
  deleteContent: (id: string) =>
    apiClient.delete<APIResponse>(`/admin/content/${id}`),
    
  // User management
  getUsers: (params?: { page?: number; limit?: number; role?: string }) =>
    apiClient.get<PaginatedResponse<User[]>>('/admin/users', { params }),
    
  getUserById: (id: string) =>
    apiClient.get<APIResponse<User>>(`/admin/users/${id}`),
    
  updateUser: (id: string, data: Partial<User>) =>
    apiClient.put<APIResponse<User>>(`/admin/users/${id}`, data),
    
  deleteUser: (id: string) =>
    apiClient.delete<APIResponse>(`/admin/users/${id}`),
    
  // Analytics
  getDashboardStats: () =>
    apiClient.get<APIResponse<any>>('/admin/analytics/dashboard'),
    
  getContentAnalytics: (contentId: string, timeRange: string) =>
    apiClient.get<APIResponse<any>>(`/admin/analytics/content/${contentId}`, { params: { timeRange } }),
    
  getUserAnalytics: (timeRange: string) =>
    apiClient.get<APIResponse<any>>('/admin/analytics/users', { params: { timeRange } }),
    
  getRevenueAnalytics: (timeRange: string) =>
    apiClient.get<APIResponse<any>>('/admin/analytics/revenue', { params: { timeRange } }),
};

export default apiClient;