import { User, AuthResponse } from '@/lib/api/auth';
import authAPI from '@/lib/api/auth';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

class AuthManager {
  private static instance: AuthManager;
  private readonly ACCESS_TOKEN_KEY = 'onflix_access_token';
  private readonly REFRESH_TOKEN_KEY = 'onflix_refresh_token';
  private readonly USER_KEY = 'onflix_user';
  private readonly EXPIRES_AT_KEY = 'onflix_expires_at';

  private constructor() {}

  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  // Token Management
  public setTokens(authResponse: AuthResponse): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem(this.ACCESS_TOKEN_KEY, authResponse.access_token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, authResponse.refresh_token);
    localStorage.setItem(this.EXPIRES_AT_KEY, authResponse.expires_at);
    localStorage.setItem(this.USER_KEY, JSON.stringify(authResponse.user));

    // Set tokens in API client
    authAPI.setTokens(authResponse.access_token, authResponse.refresh_token);
  }

  public getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  public getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  public getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  public getTokenExpiry(): Date | null {
    if (typeof window === 'undefined') return null;
    const expiresAt = localStorage.getItem(this.EXPIRES_AT_KEY);
    return expiresAt ? new Date(expiresAt) : null;
  }

  public clearTokens(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.EXPIRES_AT_KEY);

    // Clear tokens from API client
    authAPI.clearTokens();
  }

  // Authentication State
  public isAuthenticated(): boolean {
    const token = this.getAccessToken();
    const user = this.getUser();
    
    if (!token || !user) return false;

    // Check if token is expired
    const expiry = this.getTokenExpiry();
    if (expiry && new Date() >= expiry) {
      return false;
    }

    return true;
  }

  public getAuthState(): AuthState {
    return {
      user: this.getUser(),
      isAuthenticated: this.isAuthenticated(),
      isLoading: false,
      accessToken: this.getAccessToken(),
      refreshToken: this.getRefreshToken(),
    };
  }

  // Token Refresh
  public async refreshTokens(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await authAPI.refreshToken({ refresh_token: refreshToken });
      if (response.success && response.data) {
        this.setTokens(response.data);
        return true;
      }
      return false;
    } catch (error) {
      this.clearTokens();
      return false;
    }
  }

  // Role-based permissions
  public hasRole(role: string): boolean {
    const user = this.getUser();
    return user?.role === role;
  }

  public isAdmin(): boolean {
    return this.hasRole('admin');
  }

  public isUser(): boolean {
    return this.hasRole('user');
  }

  // Subscription checks
  public hasActiveSubscription(): boolean {
    const user = this.getUser();
    return user?.subscription_status === 'active';
  }

  public canStream(): boolean {
    return this.isAuthenticated() && this.hasActiveSubscription();
  }

  public canDownload(): boolean {
    return this.canStream(); // Same requirements for now
  }

  // Auto refresh setup
  public setupAutoRefresh(): void {
    if (typeof window === 'undefined') return;

    const checkAndRefresh = async () => {
      const expiry = this.getTokenExpiry();
      if (!expiry) return;

      // Refresh token 5 minutes before expiry
      const refreshTime = new Date(expiry.getTime() - 5 * 60 * 1000);
      const now = new Date();

      if (now >= refreshTime && this.isAuthenticated()) {
        await this.refreshTokens();
      }
    };

    // Check every minute
    setInterval(checkAndRefresh, 60 * 1000);
  }

  // Logout
  public async logout(): Promise<void> {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      this.clearTokens();
    }
  }
}

export const authManager = AuthManager.getInstance();

