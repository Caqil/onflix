

export const API_ENDPOINTS = {
  // Auth
  REGISTER: '/api/v1/auth/register',
  LOGIN: '/api/v1/auth/login',
  LOGOUT: '/api/v1/auth/logout',
  REFRESH: '/api/v1/auth/refresh',
  FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
  RESET_PASSWORD: '/api/v1/auth/reset-password',
  VERIFY_EMAIL: '/api/v1/auth/verify-email',
  
  // Content
  CONTENT: '/api/v1/content',
  CONTENT_SEARCH: '/api/v1/content/search',
  CONTENT_FEATURED: '/api/v1/content/featured',
  CONTENT_TRENDING: '/api/v1/content/trending',
  CONTENT_NEW: '/api/v1/content/new-releases',
  
  // User
  USER_PROFILE: '/api/v1/user/profile',
  USER_SUBSCRIPTION: '/api/v1/user/subscription',
  USER_WATCHLIST: '/api/v1/user/watchlist',
  USER_HISTORY: '/api/v1/user/history',
  USER_DOWNLOADS: '/api/v1/content/downloads',
  
  // Admin
  ADMIN_DASHBOARD: '/api/v1/admin/dashboard',
  ADMIN_USERS: '/api/v1/admin/users',
  ADMIN_CONTENT: '/api/v1/admin/content',
  ADMIN_ANALYTICS: '/api/v1/admin/analytics',
} as const;


export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  PAST_DUE: 'past_due', 
  UNPAID: 'unpaid',
  CANCELLED: 'cancelled',
  INCOMPLETE: 'incomplete',
  INCOMPLETE_EXPIRED: 'incomplete_expired',
  TRIALING: 'trialing',
  PAUSED: 'paused',
} as const;

export const SORT_OPTIONS = {
  TITLE_ASC: 'title:asc',
  TITLE_DESC: 'title:desc',
  RATING_ASC: 'rating:asc',
  RATING_DESC: 'rating:desc',
  RELEASE_DATE_ASC: 'release_date:asc',
  RELEASE_DATE_DESC: 'release_date:desc',
  POPULARITY_ASC: 'popularity:asc',
  POPULARITY_DESC: 'popularity:desc',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
export const MATURITY_RATINGS = [
  'G', 'PG', 'PG-13', 'R', 'NC-17', // Movies
  'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA', // TV Shows
] as const;
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  EMAIL_MAX_LENGTH: 255,
  DESCRIPTION_MIN_LENGTH: 10, // Added to match backend
  DESCRIPTION_MAX_LENGTH: 2000, // Updated to match backend
  TITLE_MIN_LENGTH: 1, // Added to match backend
  TITLE_MAX_LENGTH: 200,
  SEARCH_QUERY_MIN_LENGTH: 2, // Added to match backend
  SEARCH_QUERY_MAX_LENGTH: 100, // Added to match backend
} as const;

export const FILE_UPLOAD = {
  MAX_SIZE: 500 * 1024 * 1024, // 500MB
  ALLOWED_VIDEO_TYPES: [
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/mkv',
    'video/webm',
  ],
  ALLOWED_IMAGE_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
  ALLOWED_SUBTITLE_TYPES: [
    'text/vtt',
    'application/x-subrip',
  ],
} as const;

export const ERRORS = {
  NETWORK_ERROR: 'Network error occurred',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  SERVER_ERROR: 'Internal server error',
  SUBSCRIPTION_REQUIRED: 'Active subscription required',
} as const;

// App configuration
export const APP_CONFIG = {
  NAME: "OnFlix",
  DESCRIPTION: "Premium streaming platform for movies and TV shows",
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  VERSION: "1.0.0",
  SUPPORT_EMAIL: "support@onflix.com",
  COMPANY_NAME: "OnFlix Inc.",
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  ENABLE_SOCIAL_LOGIN: process.env.NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN === "true",
  ENABLE_OFFLINE_DOWNLOADS: process.env.NEXT_PUBLIC_ENABLE_OFFLINE_DOWNLOADS === "true",
  ENABLE_4K_STREAMING: process.env.NEXT_PUBLIC_ENABLE_4K_STREAMING === "true",
  ENABLE_NOTIFICATIONS: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === "true",
  ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true",
  ENABLE_BETA_FEATURES: process.env.NEXT_PUBLIC_ENABLE_BETA_FEATURES === "true",
  ENABLE_USER_REVIEWS: process.env.NEXT_PUBLIC_ENABLE_USER_REVIEWS === "true",
  ENABLE_CONTENT_RATINGS: process.env.NEXT_PUBLIC_ENABLE_CONTENT_RATINGS === "true",
  ENABLE_WATCHLIST: process.env.NEXT_PUBLIC_ENABLE_WATCHLIST === "true",
  ENABLE_RECOMMENDATIONS: process.env.NEXT_PUBLIC_ENABLE_RECOMMENDATIONS === "true",
} as const;

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: "free",
    name: "Free",
    price: 0,
    currency: "USD",
    interval: "month" as const,
    features: [
      "Limited content access",
      "480p streaming quality",
      "Ads supported",
      "1 concurrent stream",
    ],
    max_streams: 1,
    max_downloads: 0,
    video_quality: ["480p"] as const,
    trial_days: 0,
  },
  BASIC: {
    id: "basic",
    name: "Basic",
    price: 9.99,
    currency: "USD",
    interval: "month" as const,
    features: [
      "Full content library",
      "720p streaming quality",
      "No ads",
      "2 concurrent streams",
      "Mobile downloads",
    ],
    max_streams: 2,
    max_downloads: 10,
    video_quality: ["480p", "720p"] as const,
    trial_days: 7,
  },
  PREMIUM: {
    id: "premium",
    name: "Premium",
    price: 15.99,
    currency: "USD",
    interval: "month" as const,
    features: [
      "Full content library",
      "1080p streaming quality",
      "No ads",
      "4 concurrent streams",
      "Unlimited downloads",
      "Early access to new content",
    ],
    max_streams: 4,
    max_downloads: -1, // unlimited
    video_quality: ["480p", "720p", "1080p"] as const,
    trial_days: 7,
  },
  ULTRA: {
    id: "ultra",
    name: "Ultra",
    price: 19.99,
    currency: "USD",
    interval: "month" as const,
    features: [
      "Full content library",
      "4K Ultra HD streaming",
      "No ads",
      "6 concurrent streams",
      "Unlimited downloads",
      "Early access to new content",
      "Premium customer support",
    ],
    max_streams: 6,
    max_downloads: -1, // unlimited
    video_quality: ["480p", "720p", "1080p", "4k"] as const,
    trial_days: 7,
  },
} as const;

// API configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// Streaming configuration
export const STREAMING_CONFIG = {
  DEFAULT_QUALITY: "720p",
  SUPPORTED_FORMATS: ["mp4", "hls", "dash"],
  BUFFER_SIZE: 30, // seconds
  SEEK_THRESHOLD: 5, // seconds
  MAX_DOWNLOAD_SIZE: 5 * 1024 * 1024 * 1024, // 5GB
  SUPPORTED_SUBTITLES: ["en", "es", "fr", "de", "it", "pt", "ja", "ko", "zh"],
} as const;

// UI configuration
export const UI_CONFIG = {
  ITEMS_PER_PAGE: 20,
  SEARCH_DEBOUNCE: 300,
  TOAST_DURATION: 4000,
  ANIMATION_DURATION: 200,
  SIDEBAR_WIDTH: 280,
  HEADER_HEIGHT: 64,
} as const;

// Content types and genres
export const CONTENT_TYPES = {
  MOVIE: "movie",
  TV_SHOW: "tv_show",
} as const;

export const GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Music",
  "Mystery",
  "Romance",
  "Science Fiction",
  "TV Movie",
  "Thriller",
  "War",
  "Western",
] as const;

export const VIDEO_QUALITIES = [
  "480p",
  "720p", 
  "1080p",
  "4k"
] as const;

export const CONTENT_RATINGS = [
  "G",
  "PG",
  "PG-13",
  "R",
  "NC-17",
  "TV-Y",
  "TV-Y7",
  "TV-G",
  "TV-PG",
  "TV-14",
  "TV-MA",
] as const;

// User roles and permissions
export const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
  MODERATOR: "moderator",
} as const;

// Notification types
export const NOTIFICATION_TYPES = {
  INFO: "info",
  SUCCESS: "success", 
  WARNING: "warning",
  ERROR: "error",
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  FORBIDDEN: "Access denied.",
  NOT_FOUND: "The requested resource was not found.",
  SERVER_ERROR: "Internal server error. Please try again later.",
  VALIDATION_ERROR: "Please check your input and try again.",
  SESSION_EXPIRED: "Your session has expired. Please log in again.",
  SUBSCRIPTION_REQUIRED: "This feature requires an active subscription.",
  PAYMENT_FAILED: "Payment failed. Please try again or use a different payment method.",
  CONTENT_UNAVAILABLE: "This content is not available in your region.",
  STREAMING_ERROR: "Unable to stream content. Please try again.",
  DOWNLOAD_FAILED: "Download failed. Please try again.",
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: "Successfully logged in!",
  LOGOUT_SUCCESS: "Successfully logged out!",
  REGISTRATION_SUCCESS: "Account created successfully!",
  EMAIL_VERIFIED: "Email verified successfully!",
  PASSWORD_RESET: "Password reset successfully!",
  PROFILE_UPDATED: "Profile updated successfully!",
  SUBSCRIPTION_CREATED: "Subscription created successfully!",
  SUBSCRIPTION_UPDATED: "Subscription updated successfully!",
  SUBSCRIPTION_CANCELLED: "Subscription cancelled successfully!",
  PAYMENT_SUCCESS: "Payment processed successfully!",
  CONTENT_ADDED_TO_WATCHLIST: "Added to watchlist!",
  CONTENT_REMOVED_FROM_WATCHLIST: "Removed from watchlist!",
  REVIEW_SUBMITTED: "Review submitted successfully!",
  DOWNLOAD_STARTED: "Download started!",
  DOWNLOAD_COMPLETED: "Download completed!",
} as const;

// Validation constants
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  EMAIL_MAX_LENGTH: 255,
  NAME_MAX_LENGTH: 50,
  REVIEW_MAX_LENGTH: 1000,
  SEARCH_MIN_LENGTH: 2,
  SEARCH_MAX_LENGTH: 100,
} as const;

// External service URLs
export const EXTERNAL_URLS = {
  TMDB_API: "https://api.themoviedb.org/3",
  TMDB_IMAGE_BASE: "https://image.tmdb.org/t/p",
  STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
  GOOGLE_ANALYTICS_ID: process.env.NEXT_PUBLIC_GA_ID || "",
} as const;

// Rate limiting
export const RATE_LIMITS = {
  API_REQUESTS_PER_MINUTE: 100,
  SEARCH_REQUESTS_PER_MINUTE: 30,
  STREAMING_REQUESTS_PER_MINUTE: 10,
  DOWNLOAD_REQUESTS_PER_MINUTE: 5,
} as const;

// File upload limits
export const UPLOAD_LIMITS = {
  AVATAR_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  VIDEO_MAX_SIZE: 10 * 1024 * 1024 * 1024, // 10GB
  SUBTITLE_MAX_SIZE: 1024 * 1024, // 1MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
  ALLOWED_VIDEO_TYPES: ["video/mp4", "video/avi", "video/mkv"],
  ALLOWED_SUBTITLE_TYPES: ["text/vtt", "application/x-subrip"],
} as const;

// Cache durations (in seconds)
export const CACHE_DURATIONS = {
  CONTENT_LIST: 300, // 5 minutes
  CONTENT_DETAIL: 600, // 10 minutes
  USER_PROFILE: 180, // 3 minutes
  SEARCH_RESULTS: 120, // 2 minutes
  RECOMMENDATIONS: 900, // 15 minutes
} as const;

// Device types for responsive design
export const DEVICE_BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280,
  LARGE_DESKTOP: 1536,
} as const;

// Social media URLs (if needed)
export const SOCIAL_URLS = {
  TWITTER: "https://twitter.com/onflix",
  FACEBOOK: "https://facebook.com/onflix",
  INSTAGRAM: "https://instagram.com/onflix",
  YOUTUBE: "https://youtube.com/onflix",
} as const;