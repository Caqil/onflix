import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI, userAPI } from '@/lib/api';
import { User, AuthTokens, LoginCredentials, RegisterData } from '@/lib/types';

// Enhanced Auth State matching Go API responses
interface AuthState {
  // Core Auth Data
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // 2FA State
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  backupCodes: string[];
  qrCode: string | null;
  
  // Device State
  devices: Device[];
  currentDevice: Device | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  logoutAllDevices: () => Promise<void>;
  refreshToken: () => Promise<void>;
  
  // Email Management
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  
  // Password Management
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  
  // Social Authentication
  googleLogin: (token: string) => Promise<void>;
  facebookLogin: (token: string) => Promise<void>;
  
  // Two-Factor Authentication
  enable2FA: () => Promise<{ qr_code: string; secret: string; backup_codes: string[] }>;
  verify2FA: (code: string) => Promise<void>;
  disable2FA: () => Promise<void>;
  
  // Device Management
  loadDevices: () => Promise<void>;
  registerDevice: (device: Omit<Device, 'id' | 'is_current' | 'last_active'>) => Promise<void>;
  removeDevice: (deviceId: string) => Promise<void>;
  
  // Utility
  clearError: () => void;
  setUser: (user: User) => void;
  validateToken: () => Promise<boolean>;
}

interface Device {
  id: string;
  name: string;
  type: string;
  os: string;
  last_active: string;
  is_current: boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      backupCodes: [],
      qrCode: null,
      devices: [],
      currentDevice: null,

      // Core Authentication
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.login(credentials);
          
          if (!response.data.success) {
            throw new Error(response.data.message || 'Login failed');
          }
          
          // Go API returns: { user, access_token, refresh_token, expires_at }
          const authData = response.data.data!;
          const user = authData.user;
          const tokens: AuthTokens = {
            accessToken: authData.access_token,
            refreshToken: authData.refresh_token,
            expiresAt: authData.expires_at,
            tokenType: 'Bearer'
          };
          
          // Store tokens in localStorage
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          
          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            twoFactorEnabled: user.two_factor_enabled || false,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Login failed';
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.register(data);
          
          if (!response.data.success) {
            throw new Error(response.data.message || 'Registration failed');
          }
          
          // Go API returns same structure as login
          const authData = response.data.data!;
          const user = authData.user;
          const tokens: AuthTokens = {
            accessToken: authData.access_token,
            refreshToken: authData.refresh_token,
            expiresAt: authData.expires_at,
            tokenType: 'Bearer'
          };
          
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          
          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authAPI.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear all auth data regardless of API response
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            twoFactorEnabled: false,
            twoFactorSecret: null,
            backupCodes: [],
            qrCode: null,
            devices: [],
            currentDevice: null,
          });
        }
      },

      logoutAllDevices: async () => {
        set({ isLoading: true });
        try {
          const response = await authAPI.logout();
          if (response.data.success) {
            // Force logout from current session too
            get().logout();
          }
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Failed to logout all devices', isLoading: false });
          throw error;
        }
      },

      refreshToken: async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await authAPI.refreshToken(refreshToken);
          
          if (!response.data.success) {
            throw new Error(response.data.message || 'Token refresh failed');
          }
          
          const tokenData = response.data.data!;
          const tokens: AuthTokens = {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt: tokenData.expires_at,
            tokenType: 'Bearer'
          };
          
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          
          set({ tokens });
        } catch (error: any) {
          // Token refresh failed, logout user
          get().logout();
          throw error;
        }
      },

      // Email Management
      verifyEmail: async (token: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.verifyEmail(token);
          if (response.data.success) {
            // Update user's email verification status if user is logged in
            const { user } = get();
            if (user) {
              set({ 
                user: { ...user, email_verified: true },
                isLoading: false 
              });
            }
          }
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Email verification failed', 
            isLoading: false 
          });
          throw error;
        }
      },

      resendVerification: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          await authAPI.resendVerification(email);
          set({ isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Failed to resend verification', 
            isLoading: false 
          });
          throw error;
        }
      },

      // Password Management
      forgotPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          await authAPI.forgotPassword(email);
          set({ isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Failed to send reset email', 
            isLoading: false 
          });
          throw error;
        }
      },

      resetPassword: async (token: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          await authAPI.resetPassword(token, password);
          set({ isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Password reset failed', 
            isLoading: false 
          });
          throw error;
        }
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        set({ isLoading: true, error: null });
        try {
          await authAPI.changePassword(currentPassword, newPassword);
          set({ isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Password change failed', 
            isLoading: false 
          });
          throw error;
        }
      },

      // Social Authentication
      googleLogin: async (token: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.googleLogin(token);
          
          if (!response.data.success) {
            throw new Error(response.data.message || 'Google login failed');
          }
          
          const authData = response.data.data!;
          const user = authData.user;
          const tokens: AuthTokens = {
            accessToken: authData.access_token,
            refreshToken: authData.refresh_token,
            expiresAt: authData.expires_at,
            tokenType: 'Bearer'
          };
          
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          
          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Google login failed',
            isLoading: false
          });
          throw error;
        }
      },

      facebookLogin: async (token: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.facebookLogin(token);
          
          if (!response.data.success) {
            throw new Error(response.data.message || 'Facebook login failed');
          }
          
          const authData = response.data.data!;
          const user = authData.user;
          const tokens: AuthTokens = {
            accessToken: authData.access_token,
            refreshToken: authData.refresh_token,
            expiresAt: authData.expires_at,
            tokenType: 'Bearer'
          };
          
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          
          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Facebook login failed',
            isLoading: false
          });
          throw error;
        }
      },

      // Two-Factor Authentication
      enable2FA: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.enable2FA();
          
          if (!response.data.success) {
            throw new Error(response.data.message || '2FA setup failed');
          }
          
          const data = response.data.data!;
          set({
            qrCode: data.qr_code,
            twoFactorSecret: data.secret,
            backupCodes: data.backup_codes,
            isLoading: false
          });
          
          return data;
        } catch (error: any) {
          set({
            error: error.response?.data?.message || '2FA setup failed',
            isLoading: false
          });
          throw error;
        }
      },

      verify2FA: async (code: string) => {
        set({ isLoading: true, error: null });
        try {
          await authAPI.verify2FA(code);
          
          // Update user's 2FA status
          const { user } = get();
          if (user) {
            set({
              user: { ...user, two_factor_enabled: true },
              twoFactorEnabled: true,
              qrCode: null, // Clear QR code after successful verification
              isLoading: false
            });
          }
        } catch (error: any) {
          set({
            error: error.response?.data?.message || '2FA verification failed',
            isLoading: false
          });
          throw error;
        }
      },

      disable2FA: async () => {
        set({ isLoading: true, error: null });
        try {
          await authAPI.disable2FA();
          
          const { user } = get();
          if (user) {
            set({
              user: { ...user, two_factor_enabled: false },
              twoFactorEnabled: false,
              twoFactorSecret: null,
              backupCodes: [],
              qrCode: null,
              isLoading: false
            });
          }
        } catch (error: any) {
          set({
            error: error.response?.data?.message || '2FA disable failed',
            isLoading: false
          });
          throw error;
        }
      },

      // Device Management
      loadDevices: async () => {
        try {
          const response = await userAPI.getDevices();
          if (response.data.success) {
            const devices = response.data.data || [];
            const currentDevice = devices.find((d: Device) => d.is_current);
            set({ devices, currentDevice });
          }
        } catch (error: any) {
          console.error('Failed to load devices:', error);
        }
      },

      registerDevice: async (device) => {
        set({ isLoading: true, error: null });
        try {
          // Add user_agent property (use a default or detect from browser)
          const deviceWithUserAgent = {
            ...device,
            user_agent: navigator.userAgent
          };
          const response = await userAPI.registerDevice(deviceWithUserAgent);
          if (response.data.success) {
            const newDevice = response.data.data!;
            set(state => ({
              devices: [...state.devices, newDevice],
              currentDevice: newDevice.is_current ? newDevice : state.currentDevice,
              isLoading: false
            }));
          }
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Device registration failed',
            isLoading: false
          });
          throw error;
        }
      },

      removeDevice: async (deviceId: string) => {
        set({ isLoading: true, error: null });
        try {
          await userAPI.removeDevice(deviceId);
          set(state => ({
            devices: state.devices.filter(d => d.id !== deviceId),
            isLoading: false
          }));
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Device removal failed',
            isLoading: false
          });
          throw error;
        }
      },

      // Utility Functions
      clearError: () => set({ error: null }),
      
      setUser: (user: User) => set({ user }),
      
      validateToken: async () => {
        try {
          const response = await authAPI.validateToken();
          return response.data.success;
        } catch (error) {
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
        twoFactorEnabled: state.twoFactorEnabled,
      }),
    }
  )
);