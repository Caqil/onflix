import { z } from 'zod'

// Authentication Schemas
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})

export const registerSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]*$/, 'First name can only contain letters and spaces'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]*$/, 'Last name can only contain letters and spaces'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  acceptTerms: z
    .boolean()
    .refine(val => val === true, 'You must accept the terms and conditions'),
  newsletter: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(100, 'New password must be less than 100 characters')
    .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'New password must contain at least one lowercase letter')
    .regex(/\d/, 'New password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'New password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
})

// Profile Schemas
export const profileSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]*$/, 'First name can only contain letters and spaces'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]*$/, 'Last name can only contain letters and spaces'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  dateOfBirth: z
    .string()
    .optional()
    .refine((date) => {
      if (!date) return true
      const birthDate = new Date(date)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      return age >= 13 && age <= 120
    }, 'You must be between 13 and 120 years old'),
  country: z
    .string()
    .max(100, 'Country must be less than 100 characters')
    .optional(),
  language: z
    .string()
    .min(1, 'Language is required')
    .max(10, 'Language code must be less than 10 characters'),
  bio: z
    .string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
})

export const preferencesSchema = z.object({
  autoplay: z.boolean(),
  subtitles: z.boolean(),
  quality: z.enum(['SD', 'HD', 'FHD', '4K']),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    newReleases: z.boolean(),
    recommendations: z.boolean(),
    billing: z.boolean(),
  }),
  privacy: z.object({
    profileVisibility: z.enum(['public', 'private']),
    watchHistoryVisible: z.boolean(),
    allowDataCollection: z.boolean(),
  }),
  accessibility: z.object({
    reducedMotion: z.boolean(),
    highContrast: z.boolean(),
    fontSize: z.enum(['small', 'medium', 'large']),
    screenReader: z.boolean(),
  }),
})

// Content Schemas
export const contentSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .min(2, 'Title must be at least 2 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  type: z.enum(['movie', 'tv_show', 'documentary', 'short'], {
    required_error: 'Content type is required',
  }),
  releaseDate: z
    .string()
    .min(1, 'Release date is required')
    .refine((date) => {
      const releaseDate = new Date(date)
      const today = new Date()
      return releaseDate <= today
    }, 'Release date cannot be in the future'),
  duration: z
    .number()
    .min(1, 'Duration must be at least 1 minute')
    .max(1440, 'Duration cannot exceed 24 hours')
    .optional(),
  director: z
    .string()
    .min(1, 'Director is required')
    .min(2, 'Director name must be at least 2 characters')
    .max(100, 'Director name must be less than 100 characters'),
  producer: z
    .string()
    .max(100, 'Producer name must be less than 100 characters')
    .optional(),
  writer: z
    .string()
    .max(100, 'Writer name must be less than 100 characters')
    .optional(),
  genres: z
    .array(z.string())
    .min(1, 'At least one genre is required')
    .max(5, 'Maximum 5 genres allowed'),
  tags: z
    .array(z.string())
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
  maturityRating: z.enum(['G', 'PG', 'PG-13', 'R', 'NC-17', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA'], {
    required_error: 'Maturity rating is required',
  }),
  language: z
    .string()
    .min(1, 'Language is required')
    .max(10, 'Language code must be less than 10 characters'),
  thumbnail: z
    .string()
    .min(1, 'Thumbnail is required')
    .url('Thumbnail must be a valid URL'),
  backdrop: z
    .string()
    .min(1, 'Backdrop is required')
    .url('Backdrop must be a valid URL'),
  trailer: z
    .string()
    .url('Trailer must be a valid URL')
    .optional(),
})

export const seasonSchema = z.object({
  seasonNumber: z
    .number()
    .min(1, 'Season number must be at least 1')
    .max(100, 'Season number cannot exceed 100'),
  title: z
    .string()
    .min(1, 'Season title is required')
    .max(200, 'Season title must be less than 200 characters'),
  description: z
    .string()
    .min(1, 'Season description is required')
    .max(1000, 'Season description must be less than 1000 characters'),
  releaseDate: z.string().min(1, 'Season release date is required'),
  poster: z
    .string()
    .url('Season poster must be a valid URL')
    .optional(),
})

export const episodeSchema = z.object({
  episodeNumber: z
    .number()
    .min(1, 'Episode number must be at least 1')
    .max(1000, 'Episode number cannot exceed 1000'),
  title: z
    .string()
    .min(1, 'Episode title is required')
    .max(200, 'Episode title must be less than 200 characters'),
  description: z
    .string()
    .min(1, 'Episode description is required')
    .max(1000, 'Episode description must be less than 1000 characters'),
  thumbnail: z
    .string()
    .min(1, 'Episode thumbnail is required')
    .url('Episode thumbnail must be a valid URL'),
  duration: z
    .number()
    .min(1, 'Episode duration must be at least 1 minute')
    .max(300, 'Episode duration cannot exceed 5 hours'),
  releaseDate: z.string().min(1, 'Episode release date is required'),
})

// Search and Filter Schemas
export const searchSchema = z.object({
  query: z
    .string()
    .max(200, 'Search query must be less than 200 characters')
    .optional(),
  genre: z.string().optional(),
  type: z.enum(['movie', 'tv_show', 'documentary', 'short']).optional(),
  year: z
    .number()
    .min(1900, 'Year must be 1900 or later')
    .max(new Date().getFullYear() + 5, 'Year cannot be more than 5 years in the future')
    .optional(),
  rating: z
    .number()
    .min(0, 'Rating must be between 0 and 10')
    .max(10, 'Rating must be between 0 and 10')
    .optional(),
  maturityRating: z.enum(['G', 'PG', 'PG-13', 'R', 'NC-17', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA']).optional(),
  language: z.string().max(10, 'Language code must be less than 10 characters').optional(),
  sortBy: z.enum(['popularity', 'rating', 'release_date', 'title', 'watch_count', 'duration']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z
    .number()
    .min(1, 'Page must be at least 1')
    .max(1000, 'Page cannot exceed 1000')
    .optional(),
  limit: z
    .number()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional(),
})

// Review Schemas
export const reviewSchema = z.object({
  rating: z
    .number()
    .min(1, 'Rating must be between 1 and 10')
    .max(10, 'Rating must be between 1 and 10'),
  title: z
    .string()
    .max(100, 'Review title must be less than 100 characters')
    .optional(),
  comment: z
    .string()
    .min(10, 'Review comment must be at least 10 characters')
    .max(2000, 'Review comment must be less than 2000 characters')
    .optional(),
})

// Admin Schemas
export const userManagementSchema = z.object({
  role: z.enum(['user', 'admin', 'moderator']),
  isActive: z.boolean(),
  emailVerified: z.boolean(),
})

export const genreSchema = z.object({
  name: z
    .string()
    .min(1, 'Genre name is required')
    .min(2, 'Genre name must be at least 2 characters')
    .max(50, 'Genre name must be less than 50 characters'),
  slug: z
    .string()
    .min(1, 'Genre slug is required')
    .regex(/^[a-z0-9-]+$/, 'Genre slug can only contain lowercase letters, numbers, and hyphens'),
  description: z
    .string()
    .max(500, 'Genre description must be less than 500 characters')
    .optional(),
  isActive: z.boolean(),
  sortOrder: z
    .number()
    .min(0, 'Sort order must be 0 or greater')
    .max(1000, 'Sort order cannot exceed 1000'),
})

// Payment and Subscription Schemas
export const paymentMethodSchema = z.object({
  type: z.enum(['card', 'paypal', 'bank_transfer']),
  cardNumber: z
    .string()
    .regex(/^\d{13,19}$/, 'Card number must be 13-19 digits')
    .optional(),
  expiryMonth: z
    .number()
    .min(1, 'Expiry month must be between 1 and 12')
    .max(12, 'Expiry month must be between 1 and 12')
    .optional(),
  expiryYear: z
    .number()
    .min(new Date().getFullYear(), 'Expiry year cannot be in the past')
    .max(new Date().getFullYear() + 20, 'Expiry year is too far in the future')
    .optional(),
  cvv: z
    .string()
    .regex(/^\d{3,4}$/, 'CVV must be 3 or 4 digits')
    .optional(),
  holderName: z
    .string()
    .min(1, 'Cardholder name is required')
    .max(100, 'Cardholder name must be less than 100 characters')
    .optional(),
})

// Contact and Support Schemas
export const contactSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must be less than 200 characters'),
  message: z
    .string()
    .min(1, 'Message is required')
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be less than 2000 characters'),
  category: z.enum(['general', 'technical', 'billing', 'content', 'account']),
})

export const supportTicketSchema = z.object({
  subject: z
    .string()
    .min(1, 'Subject is required')
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must be less than 200 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  category: z.enum(['technical', 'billing', 'content', 'account', 'feature_request', 'bug_report']),
})

// File Upload Schemas
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 500 * 1024 * 1024, 'File size must be less than 500MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'].includes(file.type),
      'File type must be JPEG, PNG, WebP, MP4, or WebM'
    ),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
})

export const imageUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, 'Image size must be less than 10MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Image type must be JPEG, PNG, or WebP'
    ),
  alt: z
    .string()
    .max(200, 'Alt text must be less than 200 characters')
    .optional(),
})

export const videoUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024 * 1024, 'Video size must be less than 5GB')
    .refine(
      (file) => ['video/mp4', 'video/webm', 'video/avi', 'video/mov'].includes(file.type),
      'Video type must be MP4, WebM, AVI, or MOV'
    ),
  quality: z.enum(['SD', 'HD', 'FHD', '4K']),
  subtitles: z
    .array(z.object({
      language: z.string(),
      file: z.instanceof(File),
    }))
    .optional(),
})

// Analytics Schemas
export const analyticsDateRangeSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
}).refine((data) => {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  return start <= end
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
})

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
export type ProfileFormData = z.infer<typeof profileSchema>
export type PreferencesFormData = z.infer<typeof preferencesSchema>
export type ContentFormData = z.infer<typeof contentSchema>
export type SeasonFormData = z.infer<typeof seasonSchema>
export type EpisodeFormData = z.infer<typeof episodeSchema>
export type SearchFormData = z.infer<typeof searchSchema>
export type ReviewFormData = z.infer<typeof reviewSchema>
export type UserManagementFormData = z.infer<typeof userManagementSchema>
export type GenreFormData = z.infer<typeof genreSchema>
export type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>
export type ContactFormData = z.infer<typeof contactSchema>
export type SupportTicketFormData = z.infer<typeof supportTicketSchema>
export type FileUploadFormData = z.infer<typeof fileUploadSchema>
export type ImageUploadFormData = z.infer<typeof imageUploadSchema>
export type VideoUploadFormData = z.infer<typeof videoUploadSchema>
export type AnalyticsDateRangeFormData = z.infer<typeof analyticsDateRangeSchema>

// Validation helper functions
export const validateEmail = (email: string): boolean => {
  return loginSchema.shape.email.safeParse(email).success
}

export const validatePassword = (password: string): boolean => {
  return registerSchema._def.schema.shape.password.safeParse(password).success
}

export const validateRequired = (value: any, fieldName: string): string | null => {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`
  }
  return null
}

export const validateMinLength = (value: string, minLength: number, fieldName: string): string | null => {
  if (value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`
  }
  return null
}

export const validateMaxLength = (value: string, maxLength: number, fieldName: string): string | null => {
  if (value.length > maxLength) {
    return `${fieldName} must be less than ${maxLength} characters`
  }
  return null
}

export const validateRange = (value: number, min: number, max: number, fieldName: string): string | null => {
  if (value < min || value > max) {
    return `${fieldName} must be between ${min} and ${max}`
  }
  return null
}

export const validateUrl = (url: string): string | null => {
  try {
    new URL(url)
    return null
  } catch {
    return 'Please enter a valid URL'
  }
}

export const validateFileSize = (file: File, maxSize: number): string | null => {
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024)
    return `File size must be less than ${maxSizeMB}MB`
  }
  return null
}

export const validateFileType = (file: File, allowedTypes: string[]): string | null => {
  if (!allowedTypes.includes(file.type)) {
    return `File type must be one of: ${allowedTypes.join(', ')}`
  }
  return null
}

// Form validation helper
export const createFormValidator = <T>(schema: z.ZodSchema<T>) => {
  return (data: any): { isValid: boolean; errors: Record<string, string>; data?: T } => {
    const result = schema.safeParse(data)
    
    if (result.success) {
      return { isValid: true, errors: {}, data: result.data }
    }
    
    const errors: Record<string, string> = {}
    result.error.errors.forEach((error) => {
      const path = error.path.join('.')
      errors[path] = error.message
    })
    
    return { isValid: false, errors }
  }
}

// Export commonly used validators
export const validators = {
  login: createFormValidator(loginSchema),
  register: createFormValidator(registerSchema),
  profile: createFormValidator(profileSchema),
  content: createFormValidator(contentSchema),
  search: createFormValidator(searchSchema),
  contact: createFormValidator(contactSchema),
}

export default {
  // Schemas
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  profileSchema,
  preferencesSchema,
  contentSchema,
  seasonSchema,
  episodeSchema,
  searchSchema,
  reviewSchema,
  userManagementSchema,
  genreSchema,
  paymentMethodSchema,
  contactSchema,
  supportTicketSchema,
  fileUploadSchema,
  imageUploadSchema,
  videoUploadSchema,
  analyticsDateRangeSchema,
  
  // Validators
  validators,
  createFormValidator,
  
  // Helper functions
  validateEmail,
  validatePassword,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateRange,
  validateUrl,
  validateFileSize,
  validateFileType,
}