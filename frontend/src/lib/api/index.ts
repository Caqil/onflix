
export { default as apiClient } from './client';
export type { ApiResponse, ApiError } from './client';

// Authentication API
export { default as authAPI } from './auth';
export type {
  User,
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from './auth';

// Content API
export { default as contentAPI } from './content';
export type {
  Content,
  Season,
  Episode,
  ContentFilters,
  SearchParams,
  StreamingResponse,
  StreamingToken,
  DownloadResponse,
  Download,
  Subtitle,
  WatchProgress,
  RatingRequest,
  ReviewRequest,
} from './content';

// User API
export { default as userAPI } from './user';
export type {
  UserProfile,
  UpdateProfileRequest,
  Subscription,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  PaymentMethod,
  AddPaymentMethodRequest,
  Invoice,
  UsageStats,
  WatchlistItem,
  WatchHistoryItem,
} from './user';

// Admin API
export { default as adminAPI } from './admin';
export type {
  DashboardStats,
  AdminUser,
  UserFilters,
  CreateContentRequest,
  UpdateContentRequest,
  BanUserRequest,
  ContentAnalytics,
  RevenueStats,
  PlatformSettings,
} from './admin';

// Streaming API
export { default as streamingAPI } from './streaming';
export type {
  QualityOption,
  DownloadRequest,
  PlaybackSession,
  WatchProgress as StreamingWatchProgress,
} from './streaming';

// Recommendations API
export { default as recommendationsAPI } from './recommendations';
export type {
  Recommendation,
  RecommendationFeedback,
  PersonalizedFilters,
  SimilarContentRequest,
} from './recommendations';
// Global error handler setup
export const setupGlobalErrorHandler = () => {
  // Handle unhandled promise rejections
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      // Optionally send to error tracking service
    });
  }
};

// API status constants
export const API_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

export type ApiStatus = typeof API_STATUS[keyof typeof API_STATUS];