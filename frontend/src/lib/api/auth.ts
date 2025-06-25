
import { API_ENDPOINTS } from '../utils/constants';
import apiClient, { ApiResponse } from './client';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'user' | 'admin';
  avatar_url?: string;
  created_at: string;
  subscription_status?: 'active' | 'inactive' | 'cancelled' | 'past_due';
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface VerifyEmailRequest {
  token: string;
}

class AuthAPI {
  // User Registration
  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post(API_ENDPOINTS.REGISTER, data);
  }

  // User Login
  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post(API_ENDPOINTS.LOGIN, data);
  }

  // Refresh Token
  async refreshToken(data: RefreshTokenRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post(API_ENDPOINTS.REFRESH, data);
  }

  // Forgot Password
  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse> {
    return apiClient.post(API_ENDPOINTS.FORGOT_PASSWORD, data);
  }

  // Reset Password
  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse> {
    return apiClient.post(API_ENDPOINTS.RESET_PASSWORD, data);
  }

  // Verify Email
  async verifyEmail(data: VerifyEmailRequest): Promise<ApiResponse> {
    return apiClient.post(API_ENDPOINTS.VERIFY_EMAIL, data);
  }

  // Logout
  async logout(): Promise<ApiResponse> {
    return apiClient.post(API_ENDPOINTS.LOGOUT);
  }

  // Get current user (if needed)
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiClient.get(API_ENDPOINTS.USER_PROFILE);
  }

  // Helper methods for token management
  setTokens(accessToken: string, refreshToken: string): void {
    apiClient.setAuthTokens(accessToken, refreshToken);
  }

  clearTokens(): void {
    apiClient.clearAuthTokens();
  }

  getAccessToken(): string | null {
    return apiClient.getAccessToken();
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

const authAPI = new AuthAPI();
export default authAPI;

