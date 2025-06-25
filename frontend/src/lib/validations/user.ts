
import { z } from 'zod';
import { VALIDATION_RULES, USER_ROLES } from '@/lib/utils/constants';
import { emailSchema, nameSchema } from './auth';

// Profile validation
export const profileSchema = z.object({
  first_name: nameSchema,
  last_name: nameSchema,
  email: emailSchema,
  avatar_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

export const updateProfileSchema = z.object({
  first_name: nameSchema.optional(),
  last_name: nameSchema.optional(),
  avatar_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});
export const subscriptionStatusSchema = z.enum([
  'active',
  'past_due', 
  'unpaid',
  'cancelled',
  'incomplete',
  'incomplete_expired', 
  'trialing',
  'paused',
]);
// Subscription validation
export const createSubscriptionSchema = z.object({
  plan_id: z.string().min(1, 'Plan selection is required'),
  payment_method_id: z.string().min(1, 'Payment method is required'),
  billing_address: z.object({
    line1: z.string().min(1, 'Address line 1 is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postal_code: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required'),
  }).optional(),
});

export const updateSubscriptionSchema = z.object({
  plan_id: z.string().min(1, 'Plan selection is required'),
});

// Payment method validation
export const addPaymentMethodSchema = z.object({
  payment_method_id: z.string().min(1, 'Payment method is required'),
  set_as_default: z.boolean().optional(),
});

export const billingAddressSchema = z.object({
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postal_code: z.string().regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid postal code'),
  country: z.string().min(1, 'Country is required'),
});

// Content rating and review validation
export const ratingSchema = z.object({
  rating: z.number().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
});

export const reviewSchema = z.object({
  title: z.string()
    .min(1, 'Review title is required')
    .max(100, 'Review title is too long'),
  comment: z.string()
    .min(10, 'Review must be at least 10 characters')
    .max(VALIDATION_RULES.DESCRIPTION_MAX_LENGTH, 'Review is too long'),
  rating: z.number().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
});

// User preferences validation
export const userPreferencesSchema = z.object({
  preferred_genres: z.array(z.string()).optional(),
  preferred_language: z.string().optional(),
  auto_play_next: z.boolean().optional(),
  subtitle_language: z.string().optional(),
  video_quality: z.enum(['auto', '480p', '720p', '1080p', '4k']).optional(),
  email_notifications: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
});
export const videoQualitySchema = z.enum(['480p', '720p', '1080p', '4k']);
// Download request validation
export const downloadRequestSchema = z.object({
  quality: videoQualitySchema,
});

// Watchlist validation
export const addToWatchlistSchema = z.object({
  content_id: z.string().min(1, 'Content ID is required'),
  profile_id: z.string().optional(),
});

// Contact form validation
export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  subject: z.string()
    .min(1, 'Subject is required')
    .max(200, 'Subject is too long'),
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(VALIDATION_RULES.DESCRIPTION_MAX_LENGTH, 'Message is too long'),
  category: z.enum(['general', 'technical', 'billing', 'content', 'other']),
});

// Type exports
export type ProfileFormData = z.infer<typeof profileSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
export type CreateSubscriptionFormData = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionFormData = z.infer<typeof updateSubscriptionSchema>;
export type AddPaymentMethodFormData = z.infer<typeof addPaymentMethodSchema>;
export type BillingAddressFormData = z.infer<typeof billingAddressSchema>;
export type RatingFormData = z.infer<typeof ratingSchema>;
export type ReviewFormData = z.infer<typeof reviewSchema>;
export type UserPreferencesFormData = z.infer<typeof userPreferencesSchema>;
export type DownloadRequestFormData = z.infer<typeof downloadRequestSchema>;
export type AddToWatchlistFormData = z.infer<typeof addToWatchlistSchema>;
export type ContactFormData = z.infer<typeof contactFormSchema>;
