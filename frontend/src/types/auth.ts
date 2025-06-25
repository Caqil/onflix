import { SubscriptionStatus, UserRole } from ".";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  subscription_status?: SubscriptionStatus;
  email_verified?: boolean;
  last_login?: string;
}

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

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

// Form data types (synced with lib/validations/auth.ts)
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  terms_accepted: boolean;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirm_password: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// Permission types (synced with lib/auth/guards.ts)
export interface RouteGuardConfig {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireSubscription?: boolean;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export interface AccessCheck {
  hasAccess: boolean;
  user: User | null;
  reason?: 'authentication_required' | 'admin_required' | 'subscription_required' | 'insufficient_role';
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
