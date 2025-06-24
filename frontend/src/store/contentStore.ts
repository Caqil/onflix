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
} from '@/lib/types';

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

// Create axios instance
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

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const { access_token } = response.data.data;
          localStorage.setItem('accessToken', access_token);
          
          // Retry original request
          if (error.config) {
            error.config.headers.Authorization = `Bearer ${access_token}`;
            return axios.request(error.config);
          }
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      } else {
        // No refresh token, redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API functions - Updated to match Go backend response structure
export const authAPI = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<APIResponse<GoAuthResponse>>('/auth/login', credentials),
    
  register: (data: RegisterData) =>
    apiClient.post<APIResponse<GoAuthResponse>>('/auth/register', data),
    
  logout: () =>
    apiClient.post<APIResponse>('/auth/logout'),
    
  refreshToken: (refreshToken: string) =>
    apiClient.post<APIResponse<GoTokenResponse>>('/auth/refresh', { 
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

export const contentAPI = {
  // Browse and discovery
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
    
  getSimilarContent: (id: string) =>
    apiClient.get<APIResponse<Content[]>>(`/content/${id}/similar`),
    
  getTrailers: (id: string) =>
    apiClient.get<APIResponse<any[]>>(`/content/${id}/trailers`),
    
  // Search
  search: (params: any) =>
    apiClient.get<PaginatedResponse<Content[]>>('/content/search', { params }),
    
  getSearchSuggestions: (query: string) =>
    apiClient.get<APIResponse<string[]>>('/content/search/suggestions', { params: { q: query } }),
    
  // Genres and categories
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
    
  // Streaming endpoints (require subscription)
  stream: (contentId: string, quality?: VideoQuality) =>
    apiClient.get<APIResponse<{ streaming_url: string; video_info: ContentVideo }>>(`/content/${contentId}/stream${quality ? `/${quality}` : ''}`),
    
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
      duration,
      timestamp: new Date().toISOString()
    }),
    
  // Recommendations
  getRecommendations: () =>
    apiClient.get<APIResponse<Content[]>>('/recommendations'),
    
  getTrendingRecommendations: () =>
    apiClient.get<APIResponse<Content[]>>('/recommendations/trending'),
    
  getBecauseYouWatchedRecommendations: (contentId: string) =>
    apiClient.get<APIResponse<Content[]>>(`/recommendations/because-you-watched/${contentId}`),
    
  submitRecommendationFeedback: (feedback: { recommendationId: string; feedback: 'like' | 'dislike' | 'not_interested' }) =>
    apiClient.post<APIResponse>('/recommendations/feedback', feedback),
};

export const userAPI = {
  getProfile: () =>
    apiClient.get<APIResponse<User>>('/user/profile'),
    
  updateProfile: (data: Partial<UserProfile>) =>
    apiClient.put<APIResponse<User>>('/user/profile', data),
    
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.put<APIResponse>('/user/change-password', { 
      current_password: currentPassword, 
      new_password: newPassword 
    }),
    
  getWatchlist: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Content[]>>('/user/watchlist', { params }),
    
  addToWatchlist: (contentId: string) =>
    apiClient.post<APIResponse>('/user/watchlist', { content_id: contentId }),
    
  removeFromWatchlist: (contentId: string) =>
    apiClient.delete<APIResponse>(`/user/watchlist/${contentId}`),
    
  getWatchHistory: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<any[]>>('/user/watch-history', { params }),
    
  updateWatchProgress: (contentId: string, progress: number, duration: number) =>
    apiClient.post<APIResponse>('/user/watch-progress', { 
      content_id: contentId, 
      progress, 
      duration 
    }),
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