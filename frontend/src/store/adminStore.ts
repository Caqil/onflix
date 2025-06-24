import { create } from 'zustand';
import { adminAPI } from '@/lib/api';
import { User, Content, PaginationInfo } from '@/lib/types';

interface AdminState {
  // Dashboard Data
  dashboardStats: any | null;
  analytics: any | null;
  
  // User Management
  users: User[];
  currentUser: User | null;
  userActivity: any[];
  
  // Content Management
  adminContent: Content[];
  currentContent: Content | null;
  contentVideos: any[];
  contentSeasons: any[];
  contentEpisodes: any[];
  contentSubtitles: any[];
  reportedContent: any[];
  
  // Subscription Management
  subscriptionPlans: any[];
  currentPlan: any | null;
  subscriptions: any[];
  currentSubscription: any | null;
  subscriptionAnalytics: any | null;
  
  // Payment Management
  payments: any[];
  failedPayments: any[];
  currentPayment: any | null;
  
  // TMDB Integration
  tmdbSearchResults: any[];
  tmdbSettings: any | null;
  
  // System Management
  systemHealth: any | null;
  systemLogs: any[];
  systemMetrics: any | null;
  systemSettings: any | null;
  stripeSettings: any | null;
  emailSettings: any | null;
  
  // Reports
  userReport: any | null;
  contentReport: any | null;
  revenueReport: any | null;
  engagementReport: any | null;
  customReports: any[];
  
  // Notifications
  adminNotifications: any[];
  
  // Recommendations Management
  recommendationAlgorithm: any | null;
  recommendationPerformance: any | null;
  
  // Pagination
  pagination: PaginationInfo | null;
  
  // Loading States
  isLoading: boolean;
  isLoadingUsers: boolean;
  isLoadingContent: boolean;
  isLoadingAnalytics: boolean;
  isLoadingSystem: boolean;
  
  // Error State
  error: string | null;
  
  // Actions - Dashboard & Analytics
  loadDashboard: () => Promise<void>;
  loadAnalytics: () => Promise<void>;
  loadUserAnalytics: (timeRange: string) => Promise<void>;
  loadContentAnalytics: (timeRange: string) => Promise<void>;
  loadRevenueAnalytics: (timeRange: string) => Promise<void>;
  
  // Actions - User Management
  loadUsers: (params?: { page?: number; limit?: number; role?: string }) => Promise<void>;
  loadUserById: (id: string) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  banUser: (id: string, reason: string) => Promise<void>;
  unbanUser: (id: string) => Promise<void>;
  resetUserPassword: (id: string) => Promise<void>;
  loadUserSubscription: (id: string) => Promise<void>;
  updateUserSubscription: (id: string, data: any) => Promise<void>;
  loadUserActivity: (id: string) => Promise<void>;
  
  // Actions - Content Management
  loadAllContent: (params?: { page?: number; limit?: number; status?: string }) => Promise<void>;
  createContent: (data: FormData) => Promise<void>;
  loadContentDetails: (id: string) => Promise<void>;
  updateContent: (id: string, data: Partial<Content>) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;
  publishContent: (id: string) => Promise<void>;
  unpublishContent: (id: string) => Promise<void>;
  
  // Actions - TMDB Integration
  importFromTMDB: (tmdbId: string) => Promise<void>;
  syncWithTMDB: () => Promise<void>;
  searchTMDB: (query: string) => Promise<void>;
  
  // Actions - Video Management
  uploadVideo: (contentId: string, videoData: FormData) => Promise<void>;
  loadVideos: (contentId: string) => Promise<void>;
  updateVideo: (contentId: string, videoId: string, data: any) => Promise<void>;
  deleteVideo: (contentId: string, videoId: string) => Promise<void>;
  processVideo: (contentId: string, videoId: string) => Promise<void>;
  
  // Actions - Season & Episode Management
  createSeason: (contentId: string, seasonData: any) => Promise<void>;
  loadSeasons: (contentId: string) => Promise<void>;
  updateSeason: (contentId: string, seasonId: string, data: any) => Promise<void>;
  deleteSeason: (contentId: string, seasonId: string) => Promise<void>;
  createEpisode: (contentId: string, seasonId: string, episodeData: any) => Promise<void>;
  loadEpisodes: (contentId: string, seasonId: string) => Promise<void>;
  updateEpisode: (contentId: string, seasonId: string, episodeId: string, data: any) => Promise<void>;
  deleteEpisode: (contentId: string, seasonId: string, episodeId: string) => Promise<void>;
  
  // Actions - Subtitle Management
  uploadSubtitle: (contentId: string, subtitleData: FormData) => Promise<void>;
  loadSubtitles: (contentId: string) => Promise<void>;
  deleteSubtitle: (contentId: string, subtitleId: string) => Promise<void>;
  
  // Actions - Content Moderation
  loadReportedContent: () => Promise<void>;
  approveContent: (contentId: string) => Promise<void>;
  rejectContent: (contentId: string) => Promise<void>;
  
  // Actions - Subscription Plan Management
  loadSubscriptionPlans: () => Promise<void>;
  createSubscriptionPlan: (planData: any) => Promise<void>;
  loadSubscriptionPlan: (planId: string) => Promise<void>;
  updateSubscriptionPlan: (planId: string, data: any) => Promise<void>;
  deleteSubscriptionPlan: (planId: string) => Promise<void>;
  activateSubscriptionPlan: (planId: string) => Promise<void>;
  deactivateSubscriptionPlan: (planId: string) => Promise<void>;
  
  // Actions - Subscription Management
  loadSubscriptions: (params?: { page?: number; limit?: number }) => Promise<void>;
  loadSubscription: (subscriptionId: string) => Promise<void>;
  updateSubscription: (subscriptionId: string, data: any) => Promise<void>;
  cancelSubscription: (subscriptionId: string) => Promise<void>;
  refundSubscription: (subscriptionId: string) => Promise<void>;
  loadSubscriptionAnalytics: () => Promise<void>;
  
  // Actions - Payment Management
  loadPayments: (params?: { page?: number; limit?: number }) => Promise<void>;
  loadPayment: (paymentId: string) => Promise<void>;
  refundPayment: (paymentId: string, data: { amount?: number; reason?: string }) => Promise<void>;
  loadFailedPayments: () => Promise<void>;
  retryPayment: (paymentId: string) => Promise<void>;
  
  // Actions - System Settings
  loadSettings: () => Promise<void>;
  updateSettings: (settings: any) => Promise<void>;
  loadTMDBSettings: () => Promise<void>;
  updateTMDBSettings: (settings: any) => Promise<void>;
  loadStripeSettings: () => Promise<void>;
  updateStripeSettings: (settings: any) => Promise<void>;
  loadEmailSettings: () => Promise<void>;
  updateEmailSettings: (settings: any) => Promise<void>;
  
  // Actions - System Monitoring
  loadSystemHealth: () => Promise<void>;
  loadLogs: (params?: { level?: string; limit?: number }) => Promise<void>;
  loadMetrics: () => Promise<void>;
  clearCache: () => Promise<void>;
  backupDatabase: () => Promise<void>;
  loadDatabaseStatus: () => Promise<void>;
  
  // Actions - Reports
  loadUserReport: () => Promise<void>;
  loadContentReport: () => Promise<void>;
  loadRevenueReport: () => Promise<void>;
  loadEngagementReport: () => Promise<void>;
  generateCustomReport: (reportData: any) => Promise<void>;
  exportReport: (reportId: string) => Promise<Blob>;
  
  // Actions - Admin Notifications
  loadAdminNotifications: () => Promise<void>;
  createNotification: (notification: any) => Promise<void>;
  updateNotification: (notificationId: string, data: any) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  broadcastNotification: (notification: any) => Promise<void>;
  
  // Actions - Recommendation Management
  loadRecommendationAlgorithm: () => Promise<void>;
  updateRecommendationAlgorithm: (algorithm: any) => Promise<void>;
  retrainRecommendationModel: () => Promise<void>;
  loadRecommendationPerformance: () => Promise<void>;
  
  // Utility
  clearError: () => void;
  setCurrentUser: (user: User | null) => void;
  setCurrentContent: (content: Content | null) => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  // Initial State
  dashboardStats: null,
  analytics: null,
  users: [],
  currentUser: null,
  userActivity: [],
  adminContent: [],
  currentContent: null,
  contentVideos: [],
  contentSeasons: [],
  contentEpisodes: [],
  contentSubtitles: [],
  reportedContent: [],
  subscriptionPlans: [],
  currentPlan: null,
  subscriptions: [],
  currentSubscription: null,
  subscriptionAnalytics: null,
  payments: [],
  failedPayments: [],
  currentPayment: null,
  tmdbSearchResults: [],
  tmdbSettings: null,
  systemHealth: null,
  systemLogs: [],
  systemMetrics: null,
  systemSettings: null,
  stripeSettings: null,
  emailSettings: null,
  userReport: null,
  contentReport: null,
  revenueReport: null,
  engagementReport: null,
  customReports: [],
  adminNotifications: [],
  recommendationAlgorithm: null,
  recommendationPerformance: null,
  pagination: null,
  isLoading: false,
  isLoadingUsers: false,
  isLoadingContent: false,
  isLoadingAnalytics: false,
  isLoadingSystem: false,
  error: null,

  // Dashboard & Analytics
  loadDashboard: async () => {
    set({ isLoadingAnalytics: true, error: null });
    try {
      const response = await adminAPI.getDashboard();
      if (response.data.success) {
        set({
          dashboardStats: response.data.data,
          isLoadingAnalytics: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load dashboard',
        isLoadingAnalytics: false
      });
    }
  },

  loadAnalytics: async () => {
    set({ isLoadingAnalytics: true, error: null });
    try {
      const response = await adminAPI.getAnalytics();
      if (response.data.success) {
        set({
          analytics: response.data.data,
          isLoadingAnalytics: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load analytics',
        isLoadingAnalytics: false
      });
    }
  },

  loadUserAnalytics: async (timeRange: string) => {
    set({ isLoadingAnalytics: true, error: null });
    try {
      const response = await adminAPI.getUserAnalytics(timeRange);
      if (response.data.success) {
        set({
          analytics: { ...get().analytics, users: response.data.data },
          isLoadingAnalytics: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load user analytics',
        isLoadingAnalytics: false
      });
    }
  },

  loadContentAnalytics: async (timeRange: string) => {
    set({ isLoadingAnalytics: true, error: null });
    try {
      const response = await adminAPI.getContentAnalytics(timeRange);
      if (response.data.success) {
        set({
          analytics: { ...get().analytics, content: response.data.data },
          isLoadingAnalytics: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load content analytics',
        isLoadingAnalytics: false
      });
    }
  },

  loadRevenueAnalytics: async (timeRange: string) => {
    set({ isLoadingAnalytics: true, error: null });
    try {
      const response = await adminAPI.getRevenueAnalytics(timeRange);
      if (response.data.success) {
        set({
          analytics: { ...get().analytics, revenue: response.data.data },
          isLoadingAnalytics: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load revenue analytics',
        isLoadingAnalytics: false
      });
    }
  },

  // User Management
  loadUsers: async (params) => {
    set({ isLoadingUsers: true, error: null });
    try {
      const response = await adminAPI.getUsers(params);
      if (response.data.success) {
        set({
          users: response.data.data || [],
          pagination: response.data.pagination,
          isLoadingUsers: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load users',
        isLoadingUsers: false
      });
    }
  },

  loadUserById: async (id: string) => {
    set({ isLoadingUsers: true, error: null });
    try {
      const response = await adminAPI.getUserById(id);
      if (response.data.success) {
        set({
          currentUser: response.data.data,
          isLoadingUsers: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load user',
        isLoadingUsers: false
      });
    }
  },

  updateUser: async (id: string, data: Partial<User>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.updateUser(id, data);
      if (response.data.success) {
        const updatedUser = response.data.data!;
        set(state => ({
          users: state.users.map(u => u.id === id ? updatedUser : u),
          currentUser: state.currentUser?.id === id ? updatedUser : state.currentUser,
          isLoading: false
        }));
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update user',
        isLoading: false
      });
      throw error;
    }
  },

  deleteUser: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.deleteUser(id);
      if (response.data.success) {
        set(state => ({
          users: state.users.filter(u => u.id !== id),
          currentUser: state.currentUser?.id === id ? null : state.currentUser,
          isLoading: false
        }));
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete user',
        isLoading: false
      });
      throw error;
    }
  },

  banUser: async (id: string, reason: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.banUser(id, reason);
      if (response.data.success) {
        set(state => ({
          users: state.users.map(u => u.id === id ? { ...u, is_banned: true } : u),
          isLoading: false
        }));
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to ban user',
        isLoading: false
      });
      throw error;
    }
  },

  unbanUser: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.unbanUser(id);
      if (response.data.success) {
        set(state => ({
          users: state.users.map(u => u.id === id ? { ...u, is_banned: false } : u),
          isLoading: false
        }));
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to unban user',
        isLoading: false
      });
      throw error;
    }
  },

  resetUserPassword: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.resetUserPassword(id);
      if (response.data.success) {
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to reset user password',
        isLoading: false
      });
      throw error;
    }
  },

  loadUserSubscription: async (id: string) => {
    try {
      const response = await adminAPI.getUserSubscription(id);
      if (response.data.success) {
        // Could store user subscription data here
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load user subscription' });
    }
  },

  updateUserSubscription: async (id: string, data: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.updateUserSubscription(id, data);
      if (response.data.success) {
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update user subscription',
        isLoading: false
      });
      throw error;
    }
  },

  loadUserActivity: async (id: string) => {
    try {
      const response = await adminAPI.getUserActivity(id);
      if (response.data.success) {
        set({ userActivity: response.data.data || [] });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load user activity' });
    }
  },

  // Content Management
  loadAllContent: async (params) => {
    set({ isLoadingContent: true, error: null });
    try {
      const response = await adminAPI.getAllContent(params);
      if (response.data.success) {
        set({
          adminContent: response.data.data || [],
          pagination: response.data.pagination,
          isLoadingContent: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load content',
        isLoadingContent: false
      });
    }
  },

  createContent: async (data: FormData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.createContent(data);
      if (response.data.success) {
        const newContent = response.data.data!;
        set(state => ({
          adminContent: [newContent, ...state.adminContent],
          isLoading: false
        }));
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create content',
        isLoading: false
      });
      throw error;
    }
  },

  loadContentDetails: async (id: string) => {
    set({ isLoadingContent: true, error: null });
    try {
      const response = await adminAPI.getContentDetails(id);
      if (response.data.success) {
        set({
          currentContent: response.data.data,
          isLoadingContent: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load content details',
        isLoadingContent: false
      });
    }
  },

  updateContent: async (id: string, data: Partial<Content>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.updateContent(id, data);
      if (response.data.success) {
        const updatedContent = response.data.data!;
        set(state => ({
          adminContent: state.adminContent.map(c => c.id === id ? updatedContent : c),
          currentContent: state.currentContent?.id === id ? updatedContent : state.currentContent,
          isLoading: false
        }));
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update content',
        isLoading: false
      });
      throw error;
    }
  },

  deleteContent: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.deleteContent(id);
      if (response.data.success) {
        set(state => ({
          adminContent: state.adminContent.filter(c => c.id !== id),
          currentContent: state.currentContent?.id === id ? null : state.currentContent,
          isLoading: false
        }));
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete content',
        isLoading: false
      });
      throw error;
    }
  },

  publishContent: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.publishContent(id);
      if (response.data.success) {
        set(state => ({
          adminContent: state.adminContent.map(c => 
            c.id === id ? { ...c, status: 'published' } : c
          ),
          isLoading: false
        }));
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to publish content',
        isLoading: false
      });
      throw error;
    }
  },

  unpublishContent: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.unpublishContent(id);
      if (response.data.success) {
        set(state => ({
          adminContent: state.adminContent.map(c => 
            c.id === id ? { ...c, status: 'draft' } : c
          ),
          isLoading: false
        }));
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to unpublish content',
        isLoading: false
      });
      throw error;
    }
  },

  // TMDB Integration
  importFromTMDB: async (tmdbId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.importFromTMDB(tmdbId);
      if (response.data.success) {
        const importedContent = response.data.data!;
        set(state => ({
          adminContent: [importedContent, ...state.adminContent],
          isLoading: false
        }));
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to import from TMDB',
        isLoading: false
      });
      throw error;
    }
  },

  syncWithTMDB: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.syncWithTMDB();
      if (response.data.success) {
        // Refresh content list
        await get().loadAllContent();
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to sync with TMDB',
        isLoading: false
      });
      throw error;
    }
  },

  searchTMDB: async (query: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.searchTMDB(query);
      if (response.data.success) {
        set({
          tmdbSearchResults: response.data.data || [],
          isLoading: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to search TMDB',
        isLoading: false
      });
    }
  },

  // System Settings
  loadSettings: async () => {
    set({ isLoadingSystem: true, error: null });
    try {
      const response = await adminAPI.getSettings();
      if (response.data.success) {
        set({
          systemSettings: response.data.data,
          isLoadingSystem: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load settings',
        isLoadingSystem: false
      });
    }
  },

  updateSettings: async (settings: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.updateSettings(settings);
      if (response.data.success) {
        set({
          systemSettings: { ...get().systemSettings, ...settings },
          isLoading: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update settings',
        isLoading: false
      });
      throw error;
    }
  },

  loadTMDBSettings: async () => {
    try {
      const response = await adminAPI.getTMDBSettings();
      if (response.data.success) {
        set({ tmdbSettings: response.data.data });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load TMDB settings' });
    }
  },

  updateTMDBSettings: async (settings: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.updateTMDBSettings(settings);
      if (response.data.success) {
        set({
          tmdbSettings: { ...get().tmdbSettings, ...settings },
          isLoading: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update TMDB settings',
        isLoading: false
      });
      throw error;
    }
  },

  loadStripeSettings: async () => {
    try {
      const response = await adminAPI.getStripeSettings();
      if (response.data.success) {
        set({ stripeSettings: response.data.data });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load Stripe settings' });
    }
  },

  updateStripeSettings: async (settings: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.updateStripeSettings(settings);
      if (response.data.success) {
        set({
          stripeSettings: { ...get().stripeSettings, ...settings },
          isLoading: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update Stripe settings',
        isLoading: false
      });
      throw error;
    }
  },

  loadEmailSettings: async () => {
    try {
      const response = await adminAPI.getEmailSettings();
      if (response.data.success) {
        set({ emailSettings: response.data.data });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load email settings' });
    }
  },

  updateEmailSettings: async (settings: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.updateEmailSettings(settings);
      if (response.data.success) {
        set({
          emailSettings: { ...get().emailSettings, ...settings },
          isLoading: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update email settings',
        isLoading: false
      });
      throw error;
    }
  },

  // System Monitoring
  loadSystemHealth: async () => {
    try {
      const response = await adminAPI.getSystemHealth();
      if (response.data.success) {
        set({ systemHealth: response.data.data });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load system health' });
    }
  },

  loadLogs: async (params) => {
    try {
      const response = await adminAPI.getLogs(params);
      if (response.data.success) {
        set({ systemLogs: response.data.data || [] });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load logs' });
    }
  },

  loadMetrics: async () => {
    try {
      const response = await adminAPI.getMetrics();
      if (response.data.success) {
        set({ systemMetrics: response.data.data });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load metrics' });
    }
  },

  clearCache: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.clearCache();
      if (response.data.success) {
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to clear cache',
        isLoading: false
      });
      throw error;
    }
  },

  backupDatabase: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.backupDatabase();
      if (response.data.success) {
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to backup database',
        isLoading: false
      });
      throw error;
    }
  },

  loadDatabaseStatus: async () => {
    try {
      const response = await adminAPI.getDatabaseStatus();
      if (response.data.success) {
        // Could store database status data
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load database status' });
    }
  },

  // Video Management
  uploadVideo: async (contentId: string, videoData: FormData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.uploadVideo(contentId, videoData);
      if (response.data.success) {
        // Refresh videos list
        await get().loadVideos(contentId);
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to upload video',
        isLoading: false
      });
      throw error;
    }
  },

  loadVideos: async (contentId: string) => {
    try {
      const response = await adminAPI.getVideos(contentId);
      if (response.data.success) {
        set({ contentVideos: response.data.data || [] });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load videos' });
    }
  },

  updateVideo: async (contentId: string, videoId: string, data: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.updateVideo(contentId, videoId, data);
      if (response.data.success) {
        // Refresh videos list
        await get().loadVideos(contentId);
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update video',
        isLoading: false
      });
      throw error;
    }
  },

  deleteVideo: async (contentId: string, videoId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.deleteVideo(contentId, videoId);
      if (response.data.success) {
        set(state => ({
          contentVideos: state.contentVideos.filter(v => v.id !== videoId),
          isLoading: false
        }));
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete video',
        isLoading: false
      });
      throw error;
    }
  },

  processVideo: async (contentId: string, videoId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.processVideo(contentId, videoId);
      if (response.data.success) {
        // Video processing started
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to process video',
        isLoading: false
      });
      throw error;
    }
  },

  // Season & Episode Management
  createSeason: async (contentId: string, seasonData: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.createSeason(contentId, seasonData);
      if (response.data.success) {
        // Refresh seasons list
        await get().loadSeasons(contentId);
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create season',
        isLoading: false
      });
      throw error;
    }
  },

  loadSeasons: async (contentId: string) => {
    try {
      const response = await adminAPI.getSeasons(contentId);
      if (response.data.success) {
        set({ contentSeasons: response.data.data || [] });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load seasons' });
    }
  },

  updateSeason: async (contentId: string, seasonId: string, data: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.updateSeason(contentId, seasonId, data);
      if (response.data.success) {
        // Refresh seasons list
        await get().loadSeasons(contentId);
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update season',
        isLoading: false
      });
      throw error;
    }
  },

  deleteSeason: async (contentId: string, seasonId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.deleteSeason(contentId, seasonId);
      if (response.data.success) {
        set(state => ({
          contentSeasons: state.contentSeasons.filter(s => s.id !== seasonId),
          isLoading: false
        }));
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete season',
        isLoading: false
      });
      throw error;
    }
  },

  createEpisode: async (contentId: string, seasonId: string, episodeData: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.createEpisode(contentId, seasonId, episodeData);
      if (response.data.success) {
        // Refresh episodes list
        await get().loadEpisodes(contentId, seasonId);
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create episode',
        isLoading: false
      });
      throw error;
    }
  },

  loadEpisodes: async (contentId: string, seasonId: string) => {
    try {
      const response = await adminAPI.getEpisodes(contentId, seasonId);
      if (response.data.success) {
        set({ contentEpisodes: response.data.data || [] });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load episodes' });
    }
  },

  updateEpisode: async (contentId: string, seasonId: string, episodeId: string, data: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.updateEpisode(contentId, seasonId, episodeId, data);
      if (response.data.success) {
        // Refresh episodes list
        await get().loadEpisodes(contentId, seasonId);
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update episode',
        isLoading: false
      });
      throw error;
    }
  },

  deleteEpisode: async (contentId: string, seasonId: string, episodeId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.deleteEpisode(contentId, seasonId, episodeId);
      if (response.data.success) {
        set(state => ({
          contentEpisodes: state.contentEpisodes.filter(e => e.id !== episodeId),
          isLoading: false
        }));
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete episode',
        isLoading: false
      });
      throw error;
    }
  },

  // Subtitle Management
  uploadSubtitle: async (contentId: string, subtitleData: FormData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.uploadSubtitle(contentId, subtitleData);
      if (response.data.success) {
        // Refresh subtitles list
        await get().loadSubtitles(contentId);
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to upload subtitle',
        isLoading: false
      });
      throw error;
    }
  },

  loadSubtitles: async (contentId: string) => {
    try {
      const response = await adminAPI.getSubtitles(contentId);
      if (response.data.success) {
        set({ contentSubtitles: response.data.data || [] });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load subtitles' });
    }
  },

  deleteSubtitle: async (contentId: string, subtitleId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.deleteSubtitle(contentId, subtitleId);
      if (response.data.success) {
        set(state => ({
          contentSubtitles: state.contentSubtitles.filter(s => s.id !== subtitleId),
          isLoading: false
        }));
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete subtitle',
        isLoading: false
      });
      throw error;
    }
  },

  // Content Moderation
  loadReportedContent: async () => {
    try {
      const response = await adminAPI.getReportedContent();
      if (response.data.success) {
        set({ reportedContent: response.data.data || [] });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load reported content' });
    }
  },

  approveContent: async (contentId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.approveContent(contentId);
      if (response.data.success) {
        set(state => ({
          reportedContent: state.reportedContent.filter(c => c.id !== contentId),
          isLoading: false
        }));
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to approve content',
        isLoading: false
      });
      throw error;
    }
  },

  rejectContent: async (contentId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.rejectContent(contentId);
      if (response.data.success) {
        set(state => ({
          reportedContent: state.reportedContent.filter(c => c.id !== contentId),
          isLoading: false
        }));
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to reject content',
        isLoading: false
      });
      throw error;
    }
  },

  // Subscription Plan Management
  loadSubscriptionPlans: async () => {
    try {
      const response = await adminAPI.getSubscriptionPlans();
      if (response.data.success) {
        set({ subscriptionPlans: response.data.data || [] });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load subscription plans' });
    }
  },

  createSubscriptionPlan: async (planData: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.createSubscriptionPlan(planData);
      if (response.data.success) {
        const newPlan = response.data.data!;
        set(state => ({
          subscriptionPlans: [newPlan, ...state.subscriptionPlans],
          isLoading: false
        }));
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create subscription plan',
        isLoading: false
      });
      throw error;
    }
  },

  loadSubscriptionPlan: async (planId: string) => {
    try {
      const response = await adminAPI.getSubscriptionPlan(planId);
      if (response.data.success) {
        set({ currentPlan: response.data.data });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load subscription plan' });
    }
  },

  updateSubscriptionPlan: async (planId: string, data: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.updateSubscriptionPlan(planId, data);
      if (response.data.success) {
        const updatedPlan = response.data.data!;
        set(state => ({
          subscriptionPlans: state.subscriptionPlans.map(p => p.id === planId ? updatedPlan : p),
          currentPlan: state.currentPlan?.id === planId ? updatedPlan : state.currentPlan,
          isLoading: false
        }));
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update subscription plan',
        isLoading: false
      });
      throw error;
    }
  },

  deleteSubscriptionPlan: async (planId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.deleteSubscriptionPlan(planId);
      if (response.data.success) {
        set(state => ({
          subscriptionPlans: state.subscriptionPlans.filter(p => p.id !== planId),
          currentPlan: state.currentPlan?.id === planId ? null : state.currentPlan,
          isLoading: false
        }));
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete subscription plan',
        isLoading: false
      });
      throw error;
    }
  },

  activateSubscriptionPlan: async (planId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.activateSubscriptionPlan(planId);
      if (response.data.success) {
        set(state => ({
          subscriptionPlans: state.subscriptionPlans.map(p => 
            p.id === planId ? { ...p, is_active: true } : p
          ),
          isLoading: false
        }));
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to activate subscription plan',
        isLoading: false
      });
      throw error;
    }
  },

  deactivateSubscriptionPlan: async (planId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.deactivateSubscriptionPlan(planId);
      if (response.data.success) {
        set(state => ({
          subscriptionPlans: state.subscriptionPlans.map(p => 
            p.id === planId ? { ...p, is_active: false } : p
          ),
          isLoading: false
        }));
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to deactivate subscription plan',
        isLoading: false
      });
      throw error;
    }
  },

  // Subscription Management
  loadSubscriptions: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.getSubscriptions(params);
      if (response.data.success) {
        set({
          subscriptions: response.data.data || [],
          pagination: response.data.pagination,
          isLoading: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load subscriptions',
        isLoading: false
      });
    }
  },

  loadSubscription: async (subscriptionId: string) => {
    try {
      const response = await adminAPI.getSubscription(subscriptionId);
      if (response.data.success) {
        set({ currentSubscription: response.data.data });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load subscription' });
    }
  },

  updateSubscription: async (subscriptionId: string, data: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.updateSubscription(subscriptionId, data);
      if (response.data.success) {
        // Refresh subscriptions list
        await get().loadSubscriptions();
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update subscription',
        isLoading: false
      });
      throw error;
    }
  },

  cancelSubscription: async (subscriptionId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.cancelSubscription(subscriptionId);
      if (response.data.success) {
        set(state => ({
          subscriptions: state.subscriptions.map(s => 
            s.id === subscriptionId ? { ...s, status: 'cancelled' } : s
          ),
          isLoading: false
        }));
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to cancel subscription',
        isLoading: false
      });
      throw error;
    }
  },

  refundSubscription: async (subscriptionId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.refundSubscription(subscriptionId);
      if (response.data.success) {
        // Could update subscription status or refresh list
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to refund subscription',
        isLoading: false
      });
      throw error;
    }
  },

  loadSubscriptionAnalytics: async () => {
    try {
      const response = await adminAPI.getSubscriptionAnalytics();
      if (response.data.success) {
        set({ subscriptionAnalytics: response.data.data });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load subscription analytics' });
    }
  },

  // Payment Management
  loadPayments: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.getPayments(params);
      if (response.data.success) {
        set({
          payments: response.data.data || [],
          pagination: response.data.pagination,
          isLoading: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load payments',
        isLoading: false
      });
    }
  },

  loadPayment: async (paymentId: string) => {
    try {
      const response = await adminAPI.getPayment(paymentId);
      if (response.data.success) {
        set({ currentPayment: response.data.data });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load payment' });
    }
  },

  refundPayment: async (paymentId: string, data: { amount?: number; reason?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.refundPayment(paymentId, data);
      if (response.data.success) {
        // Could update payment status or refresh list
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to refund payment',
        isLoading: false
      });
      throw error;
    }
  },

  loadFailedPayments: async () => {
    try {
      const response = await adminAPI.getFailedPayments();
      if (response.data.success) {
        set({ failedPayments: response.data.data || [] });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load failed payments' });
    }
  },

  retryPayment: async (paymentId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.retryPayment(paymentId);
      if (response.data.success) {
        // Refresh failed payments list
        await get().loadFailedPayments();
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to retry payment',
        isLoading: false
      });
      throw error;
    }
  },

  // Reports
  loadUserReport: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.getUserReport();
      if (response.data.success) {
        set({
          userReport: response.data.data,
          isLoading: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load user report',
        isLoading: false
      });
    }
  },

  loadContentReport: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.getContentReport();
      if (response.data.success) {
        set({
          contentReport: response.data.data,
          isLoading: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load content report',
        isLoading: false
      });
    }
  },

  loadRevenueReport: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.getRevenueReport();
      if (response.data.success) {
        set({
          revenueReport: response.data.data,
          isLoading: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load revenue report',
        isLoading: false
      });
    }
  },

  loadEngagementReport: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.getEngagementReport();
      if (response.data.success) {
        set({
          engagementReport: response.data.data,
          isLoading: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load engagement report',
        isLoading: false
      });
    }
  },

  generateCustomReport: async (reportData: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.generateCustomReport(reportData);
      if (response.data.success) {
        // Could store the report or add to custom reports list
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to generate custom report',
        isLoading: false
      });
      throw error;
    }
  },

  exportReport: async (reportId: string): Promise<Blob> => {
    try {
      const response = await adminAPI.exportReport(reportId);
      if (response.data.success && response.data.data) {
        // Assuming the API returns the blob data in the 'data' field
        const blob = new Blob([response.data.data], { type: 'application/octet-stream' }); // Adjust type as necessary
        return blob;
      } else {
        throw new Error(response.data.message || 'Failed to export report');
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to export report' });
      throw error;
    }
  },

  // Admin Notifications
  loadAdminNotifications: async () => {
    try {
      const response = await adminAPI.getNotifications();
      if (response.data.success) {
        set({ adminNotifications: response.data.data || [] });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load admin notifications' });
    }
  },

  createNotification: async (notification: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.createNotification(notification);
      if (response.data.success) {
        const newNotification = response.data.data!;
        set(state => ({
          adminNotifications: [newNotification, ...state.adminNotifications],
          isLoading: false
        }));
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create notification',
        isLoading: false
      });
      throw error;
    }
  },

  updateNotification: async (notificationId: string, data: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.updateNotification(notificationId, data);
      if (response.data.success) {
        const updatedNotification = response.data.data!;
        set(state => ({
          adminNotifications: state.adminNotifications.map(n => 
            n.id === notificationId ? updatedNotification : n
          ),
          isLoading: false
        }));
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update notification',
        isLoading: false
      });
      throw error;
    }
  },

  deleteNotification: async (notificationId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.deleteNotification(notificationId);
      if (response.data.success) {
        set(state => ({
          adminNotifications: state.adminNotifications.filter(n => n.id !== notificationId),
          isLoading: false
        }));
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete notification',
        isLoading: false
      });
      throw error;
    }
  },

  broadcastNotification: async (notification: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.broadcastNotification(notification);
      if (response.data.success) {
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to broadcast notification',
        isLoading: false
      });
      throw error;
    }
  },

  // Recommendation Management
  loadRecommendationAlgorithm: async () => {
    try {
      const response = await adminAPI.getRecommendationAlgorithm();
      if (response.data.success) {
        set({ recommendationAlgorithm: response.data.data });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load recommendation algorithm' });
    }
  },

  updateRecommendationAlgorithm: async (algorithm: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.updateRecommendationAlgorithm(algorithm);
      if (response.data.success) {
        set({
          recommendationAlgorithm: { ...get().recommendationAlgorithm, ...algorithm },
          isLoading: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update recommendation algorithm',
        isLoading: false
      });
      throw error;
    }
  },

  retrainRecommendationModel: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAPI.retrainRecommendationModel();
      if (response.data.success) {
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to retrain recommendation model',
        isLoading: false
      });
      throw error;
    }
  },

  loadRecommendationPerformance: async () => {
    try {
      const response = await adminAPI.getRecommendationPerformance();
      if (response.data.success) {
        set({ recommendationPerformance: response.data.data });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load recommendation performance' });
    }
  },

  // Utility
  clearError: () => set({ error: null }),
  setCurrentUser: (user: User | null) => set({ currentUser: user }),
  setCurrentContent: (content: Content | null) => set({ currentContent: content }),
}));