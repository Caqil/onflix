import { PaginationMeta } from './api';

export * from './api';
export * from './auth';
export * from './user';
export * from './content';
export * from './streaming';
export * from './admin';
export * from './recommendations';

// Common enums and constants (synced with lib/utils/constants.ts)
export type UserRole = 'user' | 'admin';

export type SubscriptionStatus = 
  | 'active' 
  | 'past_due' 
  | 'unpaid' 
  | 'cancelled'
  | 'incomplete' 
  | 'incomplete_expired' 
  | 'trialing' 
  | 'paused';

export type ContentType = 'movie' | 'tv_show';

export type ContentStatus = 'draft' | 'published' | 'archived' | 'removed';

export type VideoQuality = '480p' | '720p' | '1080p' | '4k';

export type VideoFormat = 'mp4' | 'hls' | 'dash';

export type VideoResolution = '480p' | '720p' | '1080p' | '4k';

export type DownloadStatus = 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled' | 'expired';

export type SortOption = 'title' | 'rating' | 'release_date' | 'popularity' | 'created_at' | 'updated_at';

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

// Common interfaces
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface TimestampEntity {
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  url?: string;
}
