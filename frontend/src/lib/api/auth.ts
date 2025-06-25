
import { ApiResponse } from '@/types/api';
import { API_ENDPOINTS } from '../utils/constants';
import apiClient from './client';
import { AuthResponse, ForgotPasswordRequest, LoginRequest, RefreshTokenRequest, RegisterRequest, ResetPasswordRequest, User, VerifyEmailRequest } from '@/types/auth';



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

