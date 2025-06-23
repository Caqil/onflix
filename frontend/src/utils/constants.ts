export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
export const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';
export const CDN_BASE_URL = process.env.REACT_APP_CDN_URL || 'http://localhost:3001/cdn';

export const APP_NAME = 'StreamFlix';
export const APP_VERSION = '1.0.0';

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'streamflix_auth_token',
  REFRESH_TOKEN: 'streamflix_refresh_token',
  USER_PREFERENCES: 'streamflix_user_preferences',
  THEME: 'streamflix_theme',
  LANGUAGE: 'streamflix_language',
  WATCHLIST: 'streamflix_watchlist',
  CONTINUE_WATCHING: 'streamflix_continue_watching',
} as const;

export const ROUTES = {
  HOME: '/',
  BROWSE: '/browse',
  SEARCH: '/search',
  WATCH: '/watch',
  PROFILE: '/profile',
  ADMIN: '/admin',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
} as const;

export const SUBSCRIPTION_PLANS = {
  BASIC: {
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    features: [
      'HD streaming',
      '1 device',
      'Limited content',
      'Ads included'
    ]
  },
  STANDARD: {
    id: 'standard',
    name: 'Standard',
    price: 14.99,
    features: [
      'HD streaming',
      '2 devices',
      'Full content library',
      'No ads'
    ]
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    price: 19.99,
    features: [
      '4K streaming',
      '4 devices',
      'Full content library',
      'No ads',
      'Offline downloads'
    ]
  }
} as const;

export const GENRES = [
  { id: 'action', name: 'Action' },
  { id: 'comedy', name: 'Comedy' },
  { id: 'drama', name: 'Drama' },
  { id: 'horror', name: 'Horror' },
  { id: 'sci-fi', name: 'Sci-Fi' },
  { id: 'thriller', name: 'Thriller' },
  { id: 'romance', name: 'Romance' },
  { id: 'documentary', name: 'Documentary' },
  { id: 'animation', name: 'Animation' },
  { id: 'family', name: 'Family' },
  { id: 'fantasy', name: 'Fantasy' },
  { id: 'mystery', name: 'Mystery' },
  { id: 'crime', name: 'Crime' },
  { id: 'adventure', name: 'Adventure' },
  { id: 'biography', name: 'Biography' },
] as const;

export const CONTENT_TYPES = {
  MOVIE: 'movie',
  TV_SHOW: 'tv_show',
  DOCUMENTARY: 'documentary',
  SHORT_FILM: 'short_film',
} as const;

export const VIDEO_QUALITIES = [
  { value: '240p', label: '240p' },
  { value: '360p', label: '360p' },
  { value: '480p', label: '480p' },
  { value: '720p', label: '720p (HD)' },
  { value: '1080p', label: '1080p (Full HD)' },
  { value: '1440p', label: '1440p (2K)' },
  { value: '2160p', label: '2160p (4K)' },
] as const;

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
} as const;

export const CONTENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  PROCESSING: 'processing',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

export const FILE_UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],
} as const;

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export const THEME_OPTIONS = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

export const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
] as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Internal server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  PAYMENT_ERROR: 'Payment processing failed. Please try again.',
  UPLOAD_ERROR: 'File upload failed. Please try again.',
} as const;

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in!',
  LOGOUT_SUCCESS: 'Successfully logged out!',
  REGISTRATION_SUCCESS: 'Account created successfully!',
  UPDATE_SUCCESS: 'Updated successfully!',
  DELETE_SUCCESS: 'Deleted successfully!',
  UPLOAD_SUCCESS: 'File uploaded successfully!',
  PAYMENT_SUCCESS: 'Payment processed successfully!',
} as const;