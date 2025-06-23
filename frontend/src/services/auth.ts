import { apiService, ApiResponse } from './api';
import { User } from '../context/AuthContext';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken?: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatar?: File;
  preferences?: {
    language?: string;
    theme?: string;
    notifications?: boolean;
  };
}

class AuthService {
  // Authentication endpoints
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  }

  async register(userData: RegisterData): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>('/auth/register', userData);
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    }
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await apiService.post<RefreshTokenResponse>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  }

  // Password management
  async forgotPassword(data: ResetPasswordData): Promise<void> {
    await apiService.post('/auth/forgot-password', data);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiService.post('/auth/reset-password', {
      token,
      password: newPassword,
    });
  }

  async changePassword(data: ChangePasswordData): Promise<void> {
    await apiService.post('/auth/change-password', data);
  }

  // Profile management
  async getCurrentUser(): Promise<User> {
    const response = await apiService.get<User>('/auth/me');
    return response.data;
  }

  async updateProfile(data: UpdateProfileData): Promise<User> {
    // If avatar is included, handle as multipart upload
    if (data.avatar) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'avatar' && value instanceof File) {
          formData.append('avatar', value);
        } else if (key === 'preferences' && typeof value === 'object') {
          formData.append('preferences', JSON.stringify(value));
        } else if (value !== undefined) {
          formData.append(key, String(value));
        }
      });

      const response = await apiService.patch<ApiResponse<User>>('/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } else {
      const response = await apiService.patch<User>('/auth/profile', data);
      return response.data;
    }
  }

  async deleteAccount(): Promise<void> {
    await apiService.delete('/auth/account');
  }

  // Email verification
  async sendVerificationEmail(): Promise<void> {
    await apiService.post('/auth/send-verification');
  }

  async verifyEmail(token: string): Promise<void> {
    await apiService.post('/auth/verify-email', { token });
  }

  // Two-factor authentication
  async enableTwoFactor(): Promise<{ qrCode: string; secret: string }> {
    const response = await apiService.post<{ qrCode: string; secret: string }>('/auth/2fa/enable');
    return response.data;
  }

  async confirmTwoFactor(token: string): Promise<void> {
    await apiService.post('/auth/2fa/confirm', { token });
  }

  async disableTwoFactor(token: string): Promise<void> {
    await apiService.post('/auth/2fa/disable', { token });
  }

  async verifyTwoFactor(token: string): Promise<void> {
    await apiService.post('/auth/2fa/verify', { token });
  }

  // Session management
  async getSessions(): Promise<Array<{
    id: string;
    deviceInfo: string;
    ipAddress: string;
    location: string;
    lastActive: string;
    current: boolean;
  }>> {
    const response = await apiService.get<Array<{
      id: string;
      deviceInfo: string;
      ipAddress: string;
      location: string;
      lastActive: string;
      current: boolean;
    }>>('/auth/sessions');
    return response.data;
  }

  async revokeSession(sessionId: string): Promise<void> {
    await apiService.delete(`/auth/sessions/${sessionId}`);
  }

  async revokeAllSessions(): Promise<void> {
    await apiService.delete('/auth/sessions');
  }

  // Social authentication
  async loginWithGoogle(idToken: string): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>('/auth/google', {
      idToken,
    });
    return response.data;
  }

  async loginWithFacebook(accessToken: string): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>('/auth/facebook', {
      accessToken,
    });
    return response.data;
  }

  async linkSocialAccount(provider: string, token: string): Promise<void> {
    await apiService.post(`/auth/link/${provider}`, { token });
  }

  async unlinkSocialAccount(provider: string): Promise<void> {
    await apiService.delete(`/auth/link/${provider}`);
  }

  // Account status
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const response = await apiService.post<{ exists: boolean }>('/auth/check-email', {
        email,
      });
      return response.data.exists;
    } catch (error) {
      return false;
    }
  }

  async checkUsernameExists(username: string): Promise<boolean> {
    try {
      const response = await apiService.post<{ exists: boolean }>('/auth/check-username', {
        username,
      });
      return response.data.exists;
    } catch (error) {
      return false;
    }
  }
}

// Create and export a singleton instance
export const authService = new AuthService();
export default authService;