import axios, { AxiosError, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

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
            refreshToken,
          });
          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          
          // Retry original request
          if (error.config) {
            error.config.headers.Authorization = `Bearer ${accessToken}`;
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

// API functions
export const authAPI = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<APIResponse<{ user: User; tokens: AuthTokens }>>('/auth/login', credentials),
    
  register: (data: RegisterData) =>
    apiClient.post<APIResponse<{ user: User; tokens: AuthTokens }>>('/auth/register', data),
    
  logout: () =>
    apiClient.post<APIResponse>('/auth/logout'),
    
  refreshToken: (refreshToken: string) =>
    apiClient.post<APIResponse<AuthTokens>>('/auth/refresh', { refreshToken }),
    
  forgotPassword: (email: string) =>
    apiClient.post<APIResponse>('/auth/forgot-password', { email }),
    
  resetPassword: (token: string, password: string) =>
    apiClient.post<APIResponse>('/auth/reset-password', { token, password }),
    
  verifyEmail: (token: string) =>
    apiClient.post<APIResponse>('/auth/verify-email', { token }),
};

export const contentAPI = {
  browse: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Content[]>>('/content', { params }),
    
  getFeatured: () =>
    apiClient.get<APIResponse<Content[]>>('/content/featured'),
    
  getTrending: () =>
    apiClient.get<APIResponse<Content[]>>('/content/trending'),
    
  getNewReleases: () =>
    apiClient.get<APIResponse<Content[]>>('/content/new-releases'),
    
  getOriginals: () =>
    apiClient.get<APIResponse<Content[]>>('/content/originals'),
    
  getById: (id: string) =>
    apiClient.get<APIResponse<Content>>(`/content/${id}`),
    
  getSimilar: (id: string) =>
    apiClient.get<APIResponse<Content[]>>(`/content/${id}/similar`),
    
  getTrailers: (id: string) =>
    apiClient.get<APIResponse<ContentVideo[]>>(`/content/${id}/trailers`),
    
  search: (params: SearchFilters) =>
    apiClient.get<PaginatedResponse<Content[]>>('/content/search', { params }),
    
  getSearchSuggestions: (query: string) =>
    apiClient.get<APIResponse<string[]>>('/content/search/suggestions', { params: { query } }),
    
  getGenres: () =>
    apiClient.get<APIResponse<Genre[]>>('/content/genres'),
    
  getByGenre: (genre: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Content[]>>(`/content/genres/${genre}`, { params }),
    
  // TV Show specific
  getSeasons: (showId: string) =>
    apiClient.get<APIResponse<Season[]>>(`/content/tv-shows/${showId}/seasons`),
    
  getSeason: (showId: string, seasonNumber: number) =>
    apiClient.get<APIResponse<Season>>(`/content/tv-shows/${showId}/seasons/${seasonNumber}`),
    
  getEpisodes: (showId: string, seasonNumber: number) =>
    apiClient.get<APIResponse<Episode[]>>(`/content/tv-shows/${showId}/seasons/${seasonNumber}/episodes`),
    
  getEpisode: (showId: string, seasonNumber: number, episodeNumber: number) =>
    apiClient.get<APIResponse<Episode>>(`/content/tv-shows/${showId}/seasons/${seasonNumber}/episodes/${episodeNumber}`),
    
  // Streaming (protected)
  getStreamingUrl: (contentId: string, quality?: VideoQuality) =>
    apiClient.get<APIResponse<{ streaming_url: string; video_info: ContentVideo }>>(`/content/${contentId}/stream${quality ? `/${quality}` : ''}`),
    
  getStreamingToken: (contentId: string) =>
    apiClient.post<APIResponse<{ token: string; expires_at: string }>>(`/content/${contentId}/stream/token`),
    
  streamEpisode: (showId: string, seasonNumber: number, episodeNumber: number) =>
    apiClient.get<APIResponse<{ streaming_url: string }>>(`/content/tv-shows/${showId}/seasons/${seasonNumber}/episodes/${episodeNumber}/stream`),
};

export const userAPI = {
  getProfile: () =>
    apiClient.get<APIResponse<User>>('/user/profile'),
    
  updateProfile: (data: Partial<UserProfile>) =>
    apiClient.put<APIResponse<User>>('/user/profile', data),
    
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.put<APIResponse>('/user/change-password', { currentPassword, newPassword }),
    
  getWatchlist: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Content[]>>('/user/watchlist', { params }),
    
  addToWatchlist: (contentId: string) =>
    apiClient.post<APIResponse>('/user/watchlist', { contentId }),
    
  removeFromWatchlist: (contentId: string) =>
    apiClient.delete<APIResponse>(`/user/watchlist/${contentId}`),
    
  getWatchHistory: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<any[]>>('/user/watch-history', { params }),
    
  updateWatchProgress: (contentId: string, progress: number, duration: number) =>
    apiClient.post<APIResponse>('/user/watch-progress', { contentId, progress, duration }),
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