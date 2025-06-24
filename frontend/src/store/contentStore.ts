import { create } from 'zustand';
import { contentAPI } from '@/lib/api';
import { Content, Genre, SearchFilters } from '@/lib/types';

interface ContentState {
  // Content lists
  featuredContent: Content[];
  trendingContent: Content[];
  newReleases: Content[];
  originals: Content[];
  genres: Genre[];
  
  // Current content
  currentContent: Content | null;
  relatedContent: Content[];
  
  // Search
  searchResults: Content[];
  searchSuggestions: string[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchFeaturedContent: () => Promise<void>;
  fetchTrendingContent: () => Promise<void>;
  fetchNewReleases: () => Promise<void>;
  fetchOriginals: () => Promise<void>;
  fetchGenres: () => Promise<void>;
  fetchContentById: (id: string) => Promise<void>;
  searchContent: (filters: SearchFilters) => Promise<void>;
  fetchSearchSuggestions: (query: string) => Promise<void>;
  clearSearch: () => void;
  clearError: () => void;
}

export const useContentStore = create<ContentState>((set, get) => ({
  featuredContent: [],
  trendingContent: [],
  newReleases: [],
  originals: [],
  genres: [],
  currentContent: null,
  relatedContent: [],
  searchResults: [],
  searchSuggestions: [],
  isLoading: false,
  error: null,

  fetchFeaturedContent: async () => {
    set({ isLoading: true });
    try {
      const response = await contentAPI.getFeatured();
      set({ featuredContent: response.data.data!, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch featured content', isLoading: false });
    }
  },

  fetchTrendingContent: async () => {
    try {
      const response = await contentAPI.getTrending();
      set({ trendingContent: response.data.data! });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch trending content' });
    }
  },

  fetchNewReleases: async () => {
    try {
      const response = await contentAPI.getNewReleases();
      set({ newReleases: response.data.data! });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch new releases' });
    }
  },

  fetchOriginals: async () => {
    try {
      const response = await contentAPI.getOriginals();
      set({ originals: response.data.data! });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch originals' });
    }
  },

  fetchGenres: async () => {
    try {
      const response = await contentAPI.getGenres();
      set({ genres: response.data.data! });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch genres' });
    }
  },

  fetchContentById: async (id) => {
    set({ isLoading: true });
    try {
      const [contentResponse, relatedResponse] = await Promise.all([
        contentAPI.getById(id),
        contentAPI.getSimilar(id),
      ]);
      
      set({
        currentContent: contentResponse.data.data!,
        relatedContent: relatedResponse.data.data!,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch content', isLoading: false });
    }
  },

  searchContent: async (filters) => {
    set({ isLoading: true });
    try {
      const response = await contentAPI.search(filters);
      set({ searchResults: response.data.data!, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Search failed', isLoading: false });
    }
  },

  fetchSearchSuggestions: async (query) => {
    if (query.length < 2) {
      set({ searchSuggestions: [] });
      return;
    }
    
    try {
      const response = await contentAPI.getSearchSuggestions(query);
      set({ searchSuggestions: response.data.data! });
    } catch (error) {
      // Silently fail for suggestions
      set({ searchSuggestions: [] });
    }
  },

  clearSearch: () => set({ searchResults: [], searchSuggestions: [] }),
  clearError: () => set({ error: null }),
}));

// src/hooks/useAuth.ts
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  } = useAuthStore();

  useEffect(() => {
    // Check if user is authenticated on mount
    const token = localStorage.getItem('accessToken');
    if (token && !isAuthenticated) {
      // Verify token with backend or refresh
      // This could be implemented as needed
    }
  }, [isAuthenticated]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    isAdmin: user?.role === 'admin',
    hasActiveSubscription: user?.subscription?.status === 'active',
  };
};