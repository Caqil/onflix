import { ApiResponse } from '@/types/api';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'sonner';


class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.initializeTokensFromStorage();
  }

  private initializeTokensFromStorage(): void {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('onflix_access_token');
      this.refreshToken = localStorage.getItem('onflix_refresh_token');
      
      // Set initial authorization header if token exists
      if (this.accessToken) {
        this.client.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;
      }
    }
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Always use the latest token from memory
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle 401 errors
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // Don't try to refresh on auth endpoints
          if (originalRequest.url?.includes('/auth/')) {
            return Promise.reject(error);
          }

          if (this.isRefreshing) {
            // If already refreshing, wait for it to complete
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                resolve(this.client(originalRequest));
              });
            });
          }

          this.isRefreshing = true;

          try {
            const newToken = await this.refreshAccessToken();
            if (newToken) {
              // Update the failed request with new token
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }
              
              // Notify all waiting requests
              this.refreshSubscribers.forEach(cb => cb(newToken));
              this.refreshSubscribers = [];
              
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            this.clearAuthTokens();
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle other errors
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  private handleError(error: AxiosError): void {
    const response = error.response?.data as any;
    const message = response?.message || error.message || 'An error occurred';

    // Don't show error toasts for auth endpoints to avoid spam
    if (!error.config?.url?.includes('/auth/')) {
      toast.error(message);
    }
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(`${this.baseURL}/api/v1/auth/refresh`, {
        refresh_token: this.refreshToken,
      });

      const data = response.data;
      if (data.success && data.data) {
        const { access_token, refresh_token } = data.data;
        this.setAuthTokens(access_token, refresh_token);
        return access_token;
      }
      
      throw new Error('Invalid refresh response');
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  // Public token management methods
  public setAuthTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    
    // Update axios default header
    this.client.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    
    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('onflix_access_token', accessToken);
      localStorage.setItem('onflix_refresh_token', refreshToken);
    }
  }

  public clearAuthTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    
    // Remove from axios headers
    delete this.client.defaults.headers.common['Authorization'];
    
    // Clear from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('onflix_access_token');
      localStorage.removeItem('onflix_refresh_token');
      localStorage.removeItem('onflix_user');
      localStorage.removeItem('onflix_expires_at');
    }
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public getRefreshToken(): string | null {
    return this.refreshToken;
  }

  public isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // HTTP methods
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  public async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }

  // File upload method
  public async upload<T>(
    url: string, 
    formData: FormData, 
    onProgress?: (progressEvent: any) => void
  ): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    });
    return response.data;
  }

  // Download method
  public async download(url: string, filename?: string): Promise<void> {
    const response = await this.client.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }
}

// Create singleton instance
const apiClient = new ApiClient();
export default apiClient;

// Export types
export type { AxiosRequestConfig, AxiosResponse };

