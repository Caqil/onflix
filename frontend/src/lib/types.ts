// lib/types.ts - Updated to match Go API responses

// ========== CORE API RESPONSE TYPES ==========
export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T = any> extends APIResponse<T> {
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
  has_next: boolean;
  has_previous: boolean;
}

// ========== AUTH TYPES ==========
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  tokenType: 'Bearer';
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  accept_terms: boolean;
  newsletter?: boolean;
}

// Frontend form data (what the UI collects)
export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  newsletter?: boolean;
}

// ========== USER TYPES ==========
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  role: 'user' | 'admin' | 'super_admin' | 'moderator';
  status: 'active' | 'inactive' | 'banned' | 'pending';
  email_verified: boolean;
  phone_verified: boolean;
  two_factor_enabled: boolean;
  subscription_status: 'none' | 'active' | 'cancelled' | 'paused' | 'expired';
  subscription?: UserSubscription;
  preferences?: UserPreferences;
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_banned?: boolean;
  ban_reason?: string;
  banned_until?: string;
}

export interface UserProfile {
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  date_of_birth?: string;
  country?: string;
  timezone?: string;
}

export interface UserPreferences {
  language: string;
  subtitle_language: string;
  audio_language: string;
  maturity_rating: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17';
  auto_play: boolean;
  auto_play_previews: boolean;
  quality_preference: 'auto' | '480p' | '720p' | '1080p' | '4k';
  data_usage: 'low' | 'medium' | 'high';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketing: boolean;
    new_releases: boolean;
    recommendations: boolean;
  };
}

export interface UserSubscription {
  id: string;
  plan_id: string;
  plan: SubscriptionPlan;
  status: 'active' | 'cancelled' | 'paused' | 'expired' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancelled_at?: string;
  paused_at?: string;
  resumed_at?: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

// ========== SUBSCRIPTION TYPES ==========
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  interval_count: number;
  features: string[];
  max_devices: number;
  max_quality: VideoQuality;
  max_downloads: number;
  concurrent_streams: number;
  is_active: boolean;
  stripe_price_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    funding: string;
    country: string;
  };
  billing_details?: {
    name: string;
    email: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
  is_default: boolean;
  stripe_payment_method_id?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  subscription_id: string;
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  description?: string;
  invoice_pdf?: string;
  hosted_invoice_url?: string;
  payment_intent_id?: string;
  stripe_invoice_id?: string;
  period_start: string;
  period_end: string;
  due_date?: string;
  paid_at?: string;
  created_at: string;
}

// ========== CONTENT TYPES ==========
export type ContentType = 'movie' | 'tv_show' | 'documentary' | 'short' | 'trailer';
export type ContentStatus = 'draft' | 'published' | 'archived' | 'processing' | 'failed';
export type MaturityRating = 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17';
export type VideoQuality = '480p' | '720p' | '1080p' | '4k' | 'auto';

export interface Content {
  id: string;
  title: string;
  original_title?: string;
  description: string;
  synopsis?: string;
  type: ContentType;
  status: ContentStatus;
  maturity_rating: MaturityRating;
  genres: string[];
  categories: string[];
  tags: string[];
  release_date: string;
  runtime_minutes: number;
  country: string;
  language: string;
  spoken_languages: string[];
  subtitle_languages: string[];
  
  // Media URLs
  poster_url?: string;
  backdrop_url?: string;
  trailer_url?: string;
  logo_url?: string;
  
  // Metadata
  director: string;
  cast: CastMember[];
  crew: CrewMember[];
  production_companies: string[];
  budget?: number;
  revenue?: number;
  
  // Ratings & Stats
  imdb_rating?: number;
  tmdb_rating?: number;
  user_rating?: number;
  critic_score?: number;
  view_count: number;
  like_count: number;
  dislike_count: number;
  
  // External IDs
  imdb_id?: string;
  tmdb_id?: number;
  
  // User-specific data (populated when user is authenticated)
  is_liked?: boolean;
  is_in_watchlist?: boolean;
  watch_progress?: number;
  
  // TV Show specific
  total_seasons?: number;
  total_episodes?: number;
  seasons?: Season[];
  
  // Timestamps
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface CastMember {
  name: string;
  character: string;
  profile_image?: string;
  tmdb_id?: number;
}

export interface CrewMember {
  name: string;
  job: string;
  department: string;
  profile_image?: string;
  tmdb_id?: number;
}

export interface Season {
  id: string;
  content_id: string;
  season_number: number;
  title: string;
  description?: string;
  episode_count: number;
  release_date?: string;
  poster_url?: string;
  episodes?: Episode[];
  created_at: string;
  updated_at: string;
}

export interface Episode {
  id: string;
  season_id: string;
  episode_number: number;
  title: string;
  description?: string;
  runtime_minutes: number;
  release_date?: string;
  still_url?: string;
  video_url?: string;
  is_watched?: boolean;
  watch_progress?: number;
  created_at: string;
  updated_at: string;
}

export interface ContentVideo {
  id: string;
  content_id: string;
  quality: VideoQuality;
  file_url: string;
  file_size: number;
  duration: number;
  bitrate: number;
  codec: string;
  container: string;
  resolution: string;
  fps: number;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface Subtitle {
  id: string;
  content_id: string;
  language: string;
  language_name: string;
  file_url: string;
  format: 'srt' | 'vtt' | 'ass';
  is_default: boolean;
  created_at: string;
}

// ========== WATCH DATA TYPES ==========
export interface WatchHistory {
  id: string;
  user_id: string;
  profile_id: string;
  content_id: string;
  content: Content;
  progress: number;
  duration: number;
  completed: boolean;
  quality: VideoQuality;
  device_type: string;
  device_name: string;
  ip_address: string;
  user_agent: string;
  watched_at: string;
  created_at: string;
  updated_at: string;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  profile_id: string;
  content_id: string;
  content: Content;
  added_at: string;
  notify_on_release: boolean;
}

export interface Download {
  id: string;
  user_id: string;
  content_id: string;
  content: Content;
  quality: VideoQuality;
  file_url: string;
  file_size: number;
  download_progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'expired';
  expires_at: string;
  downloaded_at?: string;
  created_at: string;
}

// ========== REVIEW & RATING TYPES ==========
export interface Review {
  id: string;
  user_id: string;
  content_id: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  title?: string;
  comment: string;
  rating: number; // 1-5 stars
  spoiler_warning: boolean;
  is_verified: boolean;
  helpful_count: number;
  not_helpful_count: number;
  user_found_helpful?: boolean; // populated for authenticated user
  created_at: string;
  updated_at: string;
}

// ========== RECOMMENDATION TYPES ==========
export interface Recommendation {
  id: string;
  user_id: string;
  content_id: string;
  content: Content;
  type: 'trending' | 'similar' | 'because_you_watched' | 'new_for_you' | 'top_picks';
  score: number;
  reason?: string;
  based_on_content_id?: string;
  created_at: string;
}

// ========== DEVICE TYPES ==========
export interface Device {
  id: string;
  user_id: string;
  name: string;
  type: 'mobile' | 'tablet' | 'desktop' | 'tv' | 'game_console' | 'other';
  os: string;
  browser?: string;
  version?: string;
  user_agent: string;
  ip_address: string;
  is_current: boolean;
  last_active: string;
  created_at: string;
}

// ========== NOTIFICATION TYPES ==========
export interface Notification {
  id: string;
  user_id: string;
  type: 'content_update' | 'new_release' | 'recommendation' | 'system' | 'billing' | 'security';
  title: string;
  message: string;
  action_url?: string;
  action_text?: string;
  image_url?: string;
  data?: Record<string, any>;
  read: boolean;
  read_at?: string;
  created_at: string;
  expires_at?: string;
}

// ========== ANALYTICS TYPES ==========
export interface AnalyticsData {
  total_users: number;
  active_users: number;
  new_users_today: number;
  total_content: number;
  total_watch_time: number;
  total_revenue: number;
  top_content: ContentAnalytics[];
  user_growth: GrowthData[];
  revenue_data: RevenueData[];
  device_stats: DeviceStats[];
  geographic_data: GeographicData[];
}

export interface ContentAnalytics {
  content_id: string;
  title: string;
  type: ContentType;
  view_count: number;
  unique_viewers: number;
  total_watch_time: number;
  average_watch_time: number;
  completion_rate: number;
  average_rating: number;
  like_ratio: number;
  download_count?: number;
}

export interface GrowthData {
  date: string;
  new_users: number;
  active_users: number;
  churned_users: number;
  total_users: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  subscriptions: number;
  churn_rate: number;
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
}

export interface DeviceStats {
  device_type: string;
  count: number;
  percentage: number;
  watch_time: number;
}

export interface GeographicData {
  country: string;
  country_code: string;
  users: number;
  watch_time: number;
  revenue: number;
}

// ========== STREAMING TYPES ==========
export interface StreamingSession {
  id: string;
  user_id: string;
  content_id: string;
  device_id: string;
  quality: VideoQuality;
  streaming_url: string;
  token: string;
  expires_at: string;
  started_at: string;
  ended_at?: string;
  bytes_streamed: number;
  buffer_events: number;
  error_count: number;
}

// ========== ERROR TYPES ==========
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ApiError {
  success: false;
  message: string;
  error: string;
  validation_errors?: ValidationError[];
  error_code?: string;
  timestamp: string;
}

// ========== FORM TYPES ==========
export interface ContentFormData {
  title: string;
  description: string;
  type: ContentType;
  maturity_rating: MaturityRating;
  genres: string[];
  release_date: string;
  runtime_minutes: number;
  director: string;
  cast: string;
  country: string;
  language: string;
  poster_file?: File;
  backdrop_file?: File;
  video_file?: File;
}

export interface UserFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
}

export interface SubscriptionFormData {
  plan_id: string;
  payment_method_id: string;
  billing_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

// ========== UTILITY TYPES ==========
export type SortOrder = 'asc' | 'desc';
export type SortField = 'created_at' | 'updated_at' | 'title' | 'rating' | 'view_count' | 'release_date';

export interface SortOptions {
  field: SortField;
  order: SortOrder;
}

export interface FilterOptions {
  type?: ContentType[];
  genres?: string[];
  maturity_rating?: MaturityRating[];
  release_year?: number[];
  language?: string[];
  status?: ContentStatus[];
}

export interface SearchParams {
  query?: string;
  page?: number;
  limit?: number;
  sort?: SortOptions;
  filters?: FilterOptions;
}

// ========== PAYMENT TYPES ==========
export interface Payment {
  id: string;
  subscription_id: string;
  invoice_id?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';
  payment_method: PaymentMethod;
  stripe_payment_intent_id?: string;
  failure_reason?: string;
  refund_amount?: number;
  refunded_at?: string;
  created_at: string;
  updated_at: string;
}

// ========== ADMIN TYPES ==========
export interface AdminUser extends User {
  permissions: string[];
  last_admin_action?: string;
  admin_notes?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  database: 'connected' | 'disconnected' | 'slow';
  redis: 'connected' | 'disconnected' | 'slow';
  storage: 'healthy' | 'slow' | 'error';
  api_latency: string;
  memory_usage: string;
  cpu_usage: string;
  disk_usage: string;
  uptime: string;
  last_check: string;
}

export interface SystemLog {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  component: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  stack_trace?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

// ========== EXPORT TYPES ==========
export interface ExportRequest {
  type: 'users' | 'content' | 'analytics' | 'revenue';
  format: 'csv' | 'xlsx' | 'pdf';
  date_range?: {
    start: string;
    end: string;
  };
  filters?: Record<string, any>;
}

// ========== WEBHOOK TYPES ==========
export interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, any>;
  provider: 'stripe' | 'tmdb' | 'paypal' | 'apple' | 'google';
  processed: boolean;
  error?: string;
  retry_count: number;
  created_at: string;
  processed_at?: string;
}

// ========== TYPE GUARDS ==========
export function isApiError(response: any): response is ApiError {
  return response && response.success === false;
}

export function isValidationError(error: any): error is { validation_errors: ValidationError[] } {
  return error && Array.isArray(error.validation_errors);
}

// ========== CONSTANTS ==========
export const CONTENT_TYPES: ContentType[] = ['movie', 'tv_show', 'documentary', 'short', 'trailer'];
export const VIDEO_QUALITIES: VideoQuality[] = ['480p', '720p', '1080p', '4k', 'auto'];
export const MATURITY_RATINGS: MaturityRating[] = ['G', 'PG', 'PG-13', 'R', 'NC-17'];
export const USER_ROLES = ['user', 'admin', 'super_admin', 'moderator'] as const;
export const SUBSCRIPTION_STATUSES = ['active', 'cancelled', 'paused', 'expired', 'past_due'] as const;