export { Header } from './layout/header';
export { Footer } from './layout/footer';
export { Sidebar } from './layout/sidebar';
export { AdminLayout } from './layout/admin-layout';

// Authentication Components
export { LoginForm, RegisterForm } from './auth/auth-forms';
export { AuthGuard, ProtectedRoute } from './auth/auth-guard';

// Content Components
export { ContentCard, ContentGrid } from './content/content-display';
export { ContentFilters, ContentSearch } from './content/content-filters';
export { ContentActions } from './content/content-actions';

// Streaming Components
export { VideoPlayer } from './streaming/video-player';

// User Components
export { ProfileManagement } from './user/profile-management';
export { SubscriptionManagement } from './user/subscription-management';
export { UserContent } from './user/user-content';

// Admin Components
export { DashboardStatsCards } from './admin/dashboard-stats';
export { UserManagementTable } from './admin/user-management';
export { ContentManagement } from './admin/content-management';
export { PaymentManagement } from './admin/payment-management';
export { PlatformSettings } from './admin/platform-settings';

// Common Components
export { 
  LoadingSpinner, 
  PageLoading, 
  ContentLoadingSkeleton, 
  TableLoadingSkeleton,
  ButtonLoading 
} from './common/loading';
export { 
  ErrorBoundary, 
  DefaultErrorFallback, 
  ApiErrorDisplay, 
  NotFound 
} from './common/error-handling';
export { 
  SearchBar, 
  SearchFilters, 
  SearchResults 
} from './common/search';
export { Pagination } from './common/pagination';
export { Modals } from './common/modals';