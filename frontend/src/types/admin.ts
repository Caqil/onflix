import { VideoQuality } from "@/lib/utils/streaming";
import { User } from "./auth";
import { Content } from "./content";
import { Subscription } from "./user";
import { ContentStatus, ContentType, SubscriptionStatus, UserRole } from '.';


export interface DashboardStats {
  total_users: number;
  active_users: number;
  new_users_today: number;
  total_content: number;
  published_content: number;
  draft_content: number;
  total_subscriptions: number;
  active_subscriptions: number;
  cancelled_subscriptions: number;
  monthly_revenue: number;
  total_revenue: number;
  average_session_duration: number;
  total_watch_time: number;
  most_watched_content: Content[];
  recent_signups: User[];
  failed_payments: number;
  churn_rate: number;
}

export interface AdminUser extends User {
  subscription?: Subscription;
  last_login?: string;
  total_watch_time: number;
  content_watched: number;
  downloads_count: number;
  payment_methods_count: number;
  is_banned: boolean;
  ban_reason?: string;
  ban_expires_at?: string;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  role?: UserRole;
  status?: 'active' | 'inactive' | 'banned';
  subscription_status?: SubscriptionStatus;
  search?: string;
  created_after?: string;
  created_before?: string;
  last_login_after?: string;
  last_login_before?: string;
}

export interface BanUserData {
  reason: string;
  duration?: number; // days, 0 for permanent
  notify_user?: boolean;
}

// Content management
export interface CreateContentData {
  title: string;
  description: string;
  type: ContentType;
  genre: string[];
  release_date: string;
  duration?: number;
  poster_url: string;
  backdrop_url?: string;
  video_url?: string;
  trailer_url?: string;
  cast?: string[];
  director?: string;
  producer?: string;
  writer?: string;
  imdb_id?: string;
  tmdb_id?: number;
  content_rating?: string;
  languages?: string[];
  countries?: string[];
  budget?: number;
  revenue?: number;
}

export interface UpdateContentData extends Partial<CreateContentData> {
  status?: ContentStatus;
  featured?: boolean;
  trending?: boolean;
}

export interface ContentAnalytics {
  content_id: string;
  title: string;
  type: ContentType;
  views: number;
  unique_viewers: number;
  total_watch_time: number;
  average_watch_time: number;
  completion_rate: number;
  rating: number;
  review_count: number;
  download_count: number;
  revenue: number;
  views_by_date: Array<{ date: string; views: number }>;
  demographic_data: {
    age_groups: Record<string, number>;
    countries: Record<string, number>;
    devices: Record<string, number>;
  };
}

// Analytics
export interface RevenueStats {
  total_revenue: number;
  monthly_revenue: number;
  yearly_revenue: number;
  subscription_revenue: number;
  one_time_revenue: number;
  average_revenue_per_user: number;
  revenue_growth: number;
  monthly_recurring_revenue: number;
  annual_recurring_revenue: number;
  customer_lifetime_value: number;
  revenue_by_plan: Record<string, number>;
  revenue_by_date: Array<{ date: string; revenue: number }>;
}

export interface UserGrowthStats {
  total_users: number;
  new_users_this_month: number;
  new_users_this_year: number;
  user_growth_rate: number;
  active_users: number;
  churned_users: number;
  churn_rate: number;
  user_retention_rate: number;
  users_by_date: Array<{ date: string; users: number }>;
  users_by_plan: Record<string, number>;
  users_by_country: Record<string, number>;
}

export interface StreamingStats {
  total_streams: number;
  concurrent_streams: number;
  peak_concurrent_streams: number;
  total_watch_time: number;
  average_session_duration: number;
  streams_by_quality: Record<VideoQuality, number>;
  streams_by_device: Record<string, number>;
  bandwidth_usage: number;
  cdn_costs: number;
  error_rate: number;
  buffering_ratio: number;
}

// Platform settings
export interface PlatformSettings {
  general: GeneralSettings;
  streaming: StreamingSettings;
  payments: PaymentSettings;
  email: EmailSettings;
  storage: StorageSettings;
  security: SecuritySettings;
}

export interface GeneralSettings {
  site_name: string;
  site_description: string;
  site_url: string;
  contact_email: string;
  support_phone?: string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  default_language: string;
  timezone: string;
  terms_url?: string;
  privacy_url?: string;
}

export interface StreamingSettings {
  max_quality: VideoQuality;
  concurrent_streams: number;
  download_enabled: boolean;
  offline_viewing_days: number;
  auto_quality_enabled: boolean;
  buffer_time: number;
  seek_preview_enabled: boolean;
  thumbnail_generation: boolean;
  video_encryption: boolean;
  drm_enabled: boolean;
}

export interface PaymentSettings {
  currency: string;
  tax_rate: number;
  trial_period_days: number;
  stripe_webhook_secret?: string;
  enable_prorations: boolean;
  require_billing_address: boolean;
  allow_payment_method_updates: boolean;
  send_invoice_emails: boolean;
}

export interface EmailSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  enable_ssl: boolean;
  welcome_email_enabled: boolean;
  subscription_emails_enabled: boolean;
  content_notification_emails: boolean;
}

export interface StorageSettings {
  provider: 'local' | 'aws' | 'gcp' | 'azure';
  max_file_size: number;
  allowed_video_formats: string[];
  allowed_image_formats: string[];
  cdn_enabled: boolean;
  cdn_url?: string;
  video_compression: boolean;
  image_optimization: boolean;
  backup_enabled: boolean;
}

export interface SecuritySettings {
  session_timeout: number;
  max_login_attempts: number;
  password_requirements: {
    min_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_numbers: boolean;
    require_symbols: boolean;
  };
  two_factor_enabled: boolean;
  ip_whitelist: string[];
  rate_limiting: {
    api_requests_per_minute: number;
    streaming_requests_per_minute: number;
  };
}
