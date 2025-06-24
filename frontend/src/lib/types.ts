export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  subscription?: Subscription
  profile?: UserProfile
  isEmailVerified: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  avatar?: string
  dateOfBirth?: string
  country?: string
  language: string
  timezone?: string
  preferences: UserPreferences
  socialLinks?: SocialLinks
  bio?: string
}

export interface UserPreferences {
  autoplay: boolean
  subtitles: boolean
  quality: VideoQuality
  notifications: NotificationSettings
  privacy: PrivacySettings
  accessibility: AccessibilitySettings
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  newReleases: boolean
  recommendations: boolean
  billing: boolean
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private'
  watchHistoryVisible: boolean
  allowDataCollection: boolean
}

export interface AccessibilitySettings {
  reducedMotion: boolean
  highContrast: boolean
  fontSize: 'small' | 'medium' | 'large'
  screenReader: boolean
}

export interface SocialLinks {
  twitter?: string
  instagram?: string
  facebook?: string
  website?: string
}

export interface Subscription {
  id: string
  userId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  stripeSubscriptionId: string
  stripeCustomerId: string
  paymentMethod?: PaymentMethod
  billingHistory: BillingRecord[]
}

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: BillingInterval
  intervalCount: number
  maxDevices: number
  maxVideoQuality: VideoQuality
  features: string[]
  isActive: boolean
  sortOrder: number
}

export interface PaymentMethod {
  id: string
  type: 'card' | 'paypal' | 'bank_transfer'
  last4?: string
  brand?: string
  expiryMonth?: number
  expiryYear?: number
  isDefault: boolean
}

export interface BillingRecord {
  id: string
  amount: number
  currency: string
  status: 'paid' | 'pending' | 'failed'
  description: string
  invoiceUrl?: string
  createdAt: string
}

export interface Content {
  id: string
  title: string
  description: string
  thumbnail: string
  backdrop: string
  trailer?: string
  type: ContentType
  genres: Genre[]
  tags: string[]
  releaseDate: string
  rating: number
  duration?: number // for movies in minutes
  seasons?: Season[] // for TV shows
  videos: ContentVideo[]
  cast: CastMember[]
  crew: CrewMember[]
  director: string
  producer?: string
  writer?: string
  status: ContentStatus
  featured: boolean
  trending: boolean
  isOriginal: boolean
  maturityRating: MaturityRating
  language: string
  subtitles: string[]
  audioTracks: AudioTrack[]
  watchCount: number
  likeCount: number
  dislikeCount: number
  averageWatchTime: number
  metadata: ContentMetadata
  createdAt: string
  updatedAt: string
}

export interface ContentMetadata {
  fileSize: number
  bitrate: number
  resolution: string
  codecVideo: string
  codecAudio: string
  hasSubtitles: boolean
  hasAudioDescription: boolean
  isHdr: boolean
  frameRate: number
}

export interface Season {
  seasonNumber: number
  title: string
  description: string
  episodes: Episode[]
  releaseDate: string
  poster?: string
  episodeCount: number
  totalDuration: number
}

export interface Episode {
  episodeNumber: number
  title: string
  description: string
  thumbnail: string
  duration: number
  videos: ContentVideo[]
  releaseDate: string
  watchCount: number
  rating?: number
}

export interface ContentVideo {
  id: string
  type: VideoType
  quality: VideoQuality
  fileUrl: string
  fileSize: number
  duration: number
  bitrate: number
  codecVideo: string
  codecAudio: string
  isHdr: boolean
}

export interface AudioTrack {
  id: string
  language: string
  label: string
  codec: string
  channels: number
  isDefault: boolean
}

export interface Genre {
  id: string
  name: string
  slug: string
  description?: string
  isActive: boolean
  sortOrder: number
}

export interface CastMember {
  id: string
  name: string
  character: string
  profileImage?: string
  bio?: string
  birthDate?: string
  nationality?: string
}

export interface CrewMember {
  id: string
  name: string
  role: string
  department: string
  profileImage?: string
  bio?: string
}

export interface WatchHistory {
  id: string
  userId: string
  contentId: string
  content: Content
  progress: number // in seconds
  duration: number // total duration in seconds
  completed: boolean
  watchedAt: string
  device: string
  quality: VideoQuality
}

export interface Watchlist {
  id: string
  userId: string
  contentId: string
  content: Content
  addedAt: string
  notifyOnRelease: boolean
}

export interface Review {
  id: string
  userId: string
  contentId: string
  rating: number
  title?: string
  comment?: string
  isVerified: boolean
  helpfulCount: number
  createdAt: string
  updatedAt: string
}

export interface StreamingSession {
  id: string
  userId: string
  contentId: string
  token: string
  quality: VideoQuality
  device: string
  ipAddress: string
  userAgent: string
  startedAt: string
  endedAt?: string
  bytesStreamed: number
  bufferEvents: number
}

export interface AnalyticsData {
  totalUsers: number
  activeUsers: number
  newUsersToday: number
  totalContent: number
  totalWatchTime: number
  topContent: ContentAnalytics[]
  userGrowth: GrowthData[]
  revenueData: RevenueData[]
  deviceStats: DeviceStats[]
  geographicData: GeographicData[]
}

export interface ContentAnalytics {
  contentId: string
  title: string
  watchCount: number
  uniqueViewers: number
  averageWatchTime: number
  completionRate: number
  rating: number
}

export interface GrowthData {
  date: string
  users: number
  revenue: number
  watchTime: number
}

export interface RevenueData {
  date: string
  amount: number
  subscriptions: number
  churn: number
}

export interface DeviceStats {
  device: string
  count: number
  percentage: number
}

export interface GeographicData {
  country: string
  users: number
  revenue: number
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
  timestamp: string
}

export interface PaginatedResponse<T = any> extends APIResponse<T> {
  pagination: PaginationInfo
}

export interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: string
  tokenType: string
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;    // ← Changed from firstName
  last_name: string;     // ← Changed from lastName
  phone?: string;        // ← Optional field Go backend accepts
acceptTerms: boolean
  newsletter?: boolean
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
export interface SearchFilters {
  query?: string
  genre?: string
  type?: ContentType
  year?: number
  rating?: number
  maturityRating?: MaturityRating
  language?: string
  sortBy?: SortOption
  sortOrder?: SortOrder
  page?: number
  limit?: number
}

// Enums and Union Types
export type UserRole = 'user' | 'admin' | 'moderator'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing'
export type BillingInterval = 'month' | 'year'
export type ContentType = 'movie' | 'tv_show' | 'documentary' | 'short'
export type ContentStatus = 'draft' | 'published' | 'archived' | 'coming_soon'
export type VideoType = 'full' | 'trailer' | 'preview' | 'behind_scenes'
export type VideoQuality = 'SD' | 'HD' | 'FHD' | '4K' | '8K'
export type MaturityRating = 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17' | 'TV-Y' | 'TV-Y7' | 'TV-G' | 'TV-PG' | 'TV-14' | 'TV-MA'
export type SortOption = 'popularity' | 'rating' | 'release_date' | 'title' | 'watch_count' | 'duration'
export type SortOrder = 'asc' | 'desc'

// Form Types
export interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
  newsletter?: boolean
}

export interface ProfileFormData {
  firstName: string
  lastName: string
  email: string
  dateOfBirth?: string
  country?: string
  language: string
  bio?: string
}

export interface PasswordChangeFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface ContentFormData {
  title: string
  description: string
  type: ContentType
  releaseDate: string
  duration?: number
  director: string
  producer?: string
  writer?: string
  genres: string[]
  tags: string[]
  maturityRating: MaturityRating
  language: string
  thumbnail: string
  backdrop: string
  trailer?: string
}

// Error Types
export interface APIError {
  message: string
  code: string
  details?: Record<string, any>
  timestamp: string
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

// Event Types
export interface PlayerEvent {
  type: 'play' | 'pause' | 'ended' | 'progress' | 'buffer' | 'error'
  timestamp: number
  data?: Record<string, any>
}

export interface AnalyticsEvent {
  type: string
  userId?: string
  contentId?: string
  sessionId?: string
  timestamp: number
  data: Record<string, any>
}

// Component Props Types
export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export interface EmptyStateProps {
  title: string
  description?: string
  action?: {
    text: string
    onClick: () => void
  }
  icon?: React.ReactNode
}
