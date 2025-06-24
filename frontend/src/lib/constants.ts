export const APP_NAME = 'Onflix'
export const APP_DESCRIPTION = 'Stream Movies & TV Shows'

export const VIDEO_QUALITIES = {
  SD: '480p',
  HD: '720p',
  FHD: '1080p',
  '4K': '2160p',
} as const

export const CONTENT_TYPES = {
  MOVIE: 'movie',
  TV_SHOW: 'tv_show',
} as const

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELED: 'canceled',
  PAST_DUE: 'past_due',
  UNPAID: 'unpaid',
} as const

export const CONTENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const

export const SORT_OPTIONS = [
  { value: 'popularity', label: 'Popularity' },
  { value: 'rating', label: 'Rating' },
  { value: 'release_date', label: 'Release Date' },
  { value: 'title', label: 'Title' },
] as const

export const GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Horror',
  'Romance',
  'Sci-Fi',
  'Thriller',
  'Documentary',
  'Animation',
] as const

export const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Japan',
  'South Korea',
] as const

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
] as const

// src/lib/validations.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  dateOfBirth: z.string().optional(),
  country: z.string().optional(),
  language: z.string().min(1, 'Language is required'),
})

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const contentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['movie', 'tv_show']),
  releaseDate: z.string().min(1, 'Release date is required'),
  duration: z.number().optional(),
  director: z.string().min(1, 'Director is required'),
  genres: z.array(z.string()).min(1, 'At least one genre is required'),
  cast: z.array(z.object({
    name: z.string(),
    character: z.string(),
    profileImage: z.string().optional(),
  })),
  thumbnail: z.string().min(1, 'Thumbnail is required'),
  backdrop: z.string().min(1, 'Backdrop is required'),
})

export const searchSchema = z.object({
  query: z.string().optional(),
  genre: z.string().optional(),
  type: z.enum(['movie', 'tv_show']).optional(),
  year: z.number().optional(),
  rating: z.number().min(0).max(10).optional(),
  sortBy: z.enum(['popularity', 'rating', 'release_date', 'title']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ProfileFormData = z.infer<typeof profileSchema>
export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>
export type ContentFormData = z.infer<typeof contentSchema>
export type SearchFormData = z.infer<typeof searchSchema>