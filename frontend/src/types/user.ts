import { ContentType, SubscriptionStatus, VideoQuality } from ".";

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  created_at: string;
  subscription_status: SubscriptionStatus;
  email_verified: boolean;
  phone?: string;
  date_of_birth?: string;
  country?: string;
  language?: string;
  timezone?: string;
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  phone?: string;
  date_of_birth?: string;
  country?: string;
  language?: string;
  timezone?: string;
}

// Subscription types
export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus; // Now uses the updated enum
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id?: string;
  trial_end?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  max_streams: number;
  max_downloads: number;
  video_quality: VideoQuality[];
  trial_days?: number;
}

export interface CreateSubscriptionData {
  plan_id: string;
  payment_method_id: string;
  billing_address?: BillingAddress;
}

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

// Payment types
export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'paypal';
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    country: string;
  };
  billing_details?: BillingAddress;
  is_default: boolean;
  created_at: string;
}

export interface Invoice {
  id: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  created: number;
  due_date?: number;
  hosted_invoice_url?: string;
  invoice_pdf?: string;
  description?: string;
  subscription_id?: string;
}

export interface UsageStats {
  total_watch_time: number;
  content_watched: number;
  downloads_used: number;
  downloads_limit: number;
  simultaneous_streams: number;
  bandwidth_used: string;
  period_start: string;
  period_end: string;
}

// Watchlist and history types
export interface WatchlistItem {
  id: string;
  title: string;
  type: ContentType;
  poster_url: string;
  added_at: string;
  genre: string[];
  rating?: number;
  release_date?: string;
}

export interface WatchHistoryItem {
  content_id: string;
  title: string;
  type: ContentType;
  poster_url: string;
  progress: number;
  duration: number;
  last_watched: string;
  completed: boolean;
  season_number?: number;
  episode_number?: number;
}

// User preferences
export interface UserPreferences {
  preferred_genres: string[];
  preferred_language: string;
  subtitle_language: string;
  auto_play_next: boolean;
  video_quality: VideoQuality;
  email_notifications: boolean;
  push_notifications: boolean;
  parental_controls: boolean;
  mature_content: boolean;
}
export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  phone?: string;
  date_of_birth?: string;
  country?: string;
  language?: string;
  timezone?: string;
}

export interface CreateSubscriptionRequest {
  plan_id: string;
  payment_method_id: string;
  billing_address?: BillingAddress;
}

export interface UpdateSubscriptionRequest {
  plan_id?: string;
}

export interface AddPaymentMethodRequest {
  payment_method_id: string;
}