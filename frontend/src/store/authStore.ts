import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '@/lib/api';
import { User, AuthTokens, LoginCredentials, RegisterData } from '@/lib/types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.login(credentials);
          
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
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Login failed';
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
          
          // Go API returns: { user, access_token, refresh_token, expires_at }
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
          const errorMessage = error.response?.data?.message || 'Registration failed';
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          // Call logout endpoint to invalidate token on server
          await authAPI.logout();
        } catch (error) {
          // Continue with logout even if server call fails
          console.error('Logout API call failed:', error);
        } finally {
          // Clear local storage and state
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      refreshToken: async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          get().logout();
          return;
        }

        try {
          const response = await authAPI.refreshToken(refreshToken);
          const tokensData = response.data.data!;
          
          const tokens: AuthTokens = {
            accessToken: tokensData.access_token,
            refreshToken: tokensData.refresh_token || refreshToken,
            expiresAt: tokensData.expires_at,
            tokenType: 'Bearer'
          };
          
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          
          set({ tokens });
        } catch (error) {
          console.error('Token refresh failed:', error);
          get().logout();
        }
      },

      clearError: () => set({ error: null }),
      
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);