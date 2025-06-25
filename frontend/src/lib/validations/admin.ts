import { z } from 'zod';
import { VALIDATION_RULES, CONTENT_TYPES, GENRES, USER_ROLES } from '@/lib/utils/constants';
import { emailSchema, nameSchema } from './auth';

// User management validation
export const adminUserSchema = z.object({
  email: emailSchema,
  first_name: nameSchema,
  last_name: nameSchema,
  role: z.enum([USER_ROLES.USER, USER_ROLES.ADMIN]),
  subscription_status: z.enum(['active', 'inactive', 'cancelled', 'past_due']).optional(),
});

export const updateUserSchema = z.object({
  first_name: nameSchema.optional(),
  last_name: nameSchema.optional(),
  role: z.enum([USER_ROLES.USER, USER_ROLES.ADMIN]).optional(),
  subscription_status: z.enum(['active', 'inactive', 'cancelled', 'past_due']).optional(),
});

export const banUserSchema = z.object({
  reason: z.string().min(1, 'Ban reason is required').max(500, 'Reason is too long'),
  duration: z.number().min(0, 'Duration cannot be negative').optional(),
  notify_user: z.boolean().optional(),
});
export const createContentSchema = z.object({
  title: z.string()
    .min(VALIDATION_RULES.TITLE_MIN_LENGTH, 'Title is required')
    .max(VALIDATION_RULES.TITLE_MAX_LENGTH, 'Title is too long'),
  description: z.string()
    .min(VALIDATION_RULES.DESCRIPTION_MIN_LENGTH, `Description must be at least ${VALIDATION_RULES.DESCRIPTION_MIN_LENGTH} characters`)
    .max(VALIDATION_RULES.DESCRIPTION_MAX_LENGTH, 'Description is too long'),
  type: z.enum(['movie', 'tv_show']),
  genres: z.array(z.string()).min(1, 'At least one genre is required'),
  maturity_rating: z.enum([
    'G', 'PG', 'PG-13', 'R', 'NC-17',
    'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA'
  ]),
  language: z.string().length(2, 'Language must be 2 characters'),
  country: z.string().length(2, 'Country must be 2 characters'),
  release_date: z.string().min(1, 'Release date is required'),
  poster_url: z.string().url('Please enter a valid poster URL'),
  backdrop_url: z.string().url('Please enter a valid backdrop URL').optional(),
  video_url: z.string().url('Please enter a valid video URL').optional(),
  trailer_url: z.string().url('Please enter a valid trailer URL').optional(),
  cast: z.array(z.string()).optional(),
  director: z.string().optional(),
  producer: z.string().optional(),
  writer: z.string().optional(),
  imdb_id: z.string().optional(),
  tmdb_id: z.number().optional(),
  budget: z.number().min(0).optional(),
  revenue: z.number().min(0).optional(),
});

export const updateContentSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(VALIDATION_RULES.TITLE_MAX_LENGTH, 'Title is too long')
    .optional(),
  description: z.string()
    .min(1, 'Description is required')
    .max(VALIDATION_RULES.DESCRIPTION_MAX_LENGTH, 'Description is too long')
    .optional(),
  genre: z.array(z.enum(GENRES as unknown as [string, ...string[]])).optional(),
  release_date: z.string().optional(),
  duration: z.number().min(1, 'Duration must be positive').optional(),
  poster_url: z.string().url('Please enter a valid poster URL').optional(),
  backdrop_url: z.string().url('Please enter a valid backdrop URL').optional(),
  video_url: z.string().url('Please enter a valid video URL').optional(),
  trailer_url: z.string().url('Please enter a valid trailer URL').optional(),
  cast: z.array(z.string()).optional(),
  director: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  featured: z.boolean().optional(),
  trending: z.boolean().optional(),
});

// TV Show specific validation
export const createSeasonSchema = z.object({
  season_number: z.number().min(1, 'Season number must be positive'),
  title: z.string().optional(),
  description: z.string().optional(),
  release_date: z.string().optional(),
  poster_url: z.string().url('Please enter a valid poster URL').optional(),
});

export const createEpisodeSchema = z.object({
  episode_number: z.number().min(1, 'Episode number must be positive'),
  title: z.string().min(1, 'Episode title is required'),
  description: z.string().optional(),
  duration: z.number().min(1, 'Duration must be positive'),
  air_date: z.string().optional(),
  video_url: z.string().url('Please enter a valid video URL'),
  thumbnail_url: z.string().url('Please enter a valid thumbnail URL').optional(),
});

// Platform settings validation
export const generalSettingsSchema = z.object({
  site_name: z.string().min(1, 'Site name is required'),
  site_description: z.string().optional(),
  maintenance_mode: z.boolean(),
  registration_enabled: z.boolean(),
  default_language: z.string().optional(),
  contact_email: emailSchema.optional(),
  support_phone: z.string().optional(),
});

export const streamingSettingsSchema = z.object({
  max_quality: z.enum(['480p', '720p', '1080p', '4k']),
  concurrent_streams: z.number().min(1, 'Must allow at least 1 concurrent stream').max(10, 'Maximum 10 concurrent streams'),
  download_enabled: z.boolean(),
  offline_viewing_days: z.number().min(1, 'Must be at least 1 day').max(365, 'Maximum 365 days'),
  auto_quality_enabled: z.boolean(),
  buffer_time: z.number().min(1, 'Buffer time must be positive').max(60, 'Maximum 60 seconds'),
});

export const paymentSettingsSchema = z.object({
  currency: z.string().min(3, 'Currency code must be 3 characters').max(3, 'Currency code must be 3 characters'),
  tax_rate: z.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate cannot exceed 100%'),
  trial_period_days: z.number().min(0, 'Trial period cannot be negative').max(365, 'Maximum 365 days'),
  stripe_webhook_secret: z.string().optional(),
  enable_prorations: z.boolean(),
});

export const emailSettingsSchema = z.object({
  smtp_host: z.string().min(1, 'SMTP host is required'),
  smtp_port: z.number().min(1, 'SMTP port must be positive').max(65535, 'Invalid port number'),
  smtp_username: z.string().min(1, 'SMTP username is required'),
  smtp_password: z.string().min(1, 'SMTP password is required'),
  from_email: emailSchema,
  from_name: z.string().min(1, 'From name is required'),
  enable_ssl: z.boolean(),
});

// Analytics filter validation
export const analyticsFilterSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'quarter', 'year']).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  content_type: z.enum([CONTENT_TYPES.MOVIE, CONTENT_TYPES.TV_SHOW]).optional(),
  genre: z.enum(GENRES as unknown as [string, ...string[]]).optional(),
});

// File upload validation
export const fileUploadSchema = z.object({
  file_type: z.enum(['video', 'image', 'subtitle']),
  max_size: z.number().min(1, 'Max size must be positive'),
  allowed_formats: z.array(z.string()).min(1, 'At least one format must be allowed'),
});

export const contentUploadSchema = z.object({
  content_id: z.string().optional(),
  file_type: z.enum(['video', 'poster', 'backdrop', 'trailer', 'subtitle']),
  quality: z.enum(['480p', '720p', '1080p', '4k']).optional(),
  language: z.string().optional(),
});

// Bulk operations validation
export const bulkActionSchema = z.object({
  action: z.enum(['delete', 'archive', 'publish', 'feature', 'unfeature']),
  item_ids: z.array(z.string()).min(1, 'At least one item must be selected'),
  reason: z.string().optional(),
});

// Report generation validation
export const reportGenerationSchema = z.object({
  type: z.enum(['users', 'content', 'revenue', 'analytics']),
  format: z.enum(['csv', 'xlsx', 'pdf']),
  period: z.enum(['week', 'month', 'quarter', 'year']).optional(),
  filters: z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    user_role: z.enum([USER_ROLES.USER, USER_ROLES.ADMIN]).optional(),
    content_type: z.enum([CONTENT_TYPES.MOVIE, CONTENT_TYPES.TV_SHOW]).optional(),
    subscription_status: z.enum(['active', 'inactive', 'cancelled', 'past_due']).optional(),
  }).optional(),
});

// Type exports
export type AdminUserFormData = z.infer<typeof adminUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
export type BanUserFormData = z.infer<typeof banUserSchema>;
export type CreateContentFormData = z.infer<typeof createContentSchema>;
export type UpdateContentFormData = z.infer<typeof updateContentSchema>;
export type CreateSeasonFormData = z.infer<typeof createSeasonSchema>;
export type CreateEpisodeFormData = z.infer<typeof createEpisodeSchema>;
export type GeneralSettingsFormData = z.infer<typeof generalSettingsSchema>;
export type StreamingSettingsFormData = z.infer<typeof streamingSettingsSchema>;
export type PaymentSettingsFormData = z.infer<typeof paymentSettingsSchema>;
export type EmailSettingsFormData = z.infer<typeof emailSettingsSchema>;
export type AnalyticsFilterFormData = z.infer<typeof analyticsFilterSchema>;
export type FileUploadFormData = z.infer<typeof fileUploadSchema>;
export type ContentUploadFormData = z.infer<typeof contentUploadSchema>;
export type BulkActionFormData = z.infer<typeof bulkActionSchema>;
export type ReportGenerationFormData = z.infer<typeof reportGenerationSchema>;

// Validation helpers for admin
export const validateContentFields = (type: string, data: any) => {
  const baseValidation = {
    title: true,
    description: true,
    genre: true,
    release_date: true,
    poster_url: true,
  };