import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { contentAPI, recommendationsAPI } from '@/lib/api';
import { Content } from '@/lib/types';

interface ContentState {
  // Content lists
  featuredContent: Content[];
  trendingContent: Content[];
  newReleases: Content[];
  originals: Content[];
  genres: { genre: string; count: number }[];
  
  // Current content
  currentContent: Content | null;
  relatedContent: Content[];
  
  // Search
  searchResults: Content[];
  searchSuggestions: string[];
  searchLoading: boolean;
  searchQuery: string;
  
  // Continue watching and recommendations
  continueWatching: Content[];
  recommendations: Content[];
  
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
  fetchSimilarContent: (id: string) => Promise<void>;
  fetchContentByGenre: (genre: string, params?: { page?: number; limit?: number }) => Promise<void>;
  searchContent: (query: string, params?: { page?: number; limit?: number; type?: string; genre?: string }) => Promise<void>;
  fetchSearchSuggestions: (query: string) => Promise<void>;
  fetchContinueWatching: () => Promise<void>;
  fetchRecommendations: () => Promise<void>;
  browseContent: (params?: { page?: number; limit?: number; genre?: string; type?: string }) => Promise<Content[]>;
  
  // Utility actions
  clearSearch: () => void;
  clearError: () => void;
  setCurrentContent: (content: Content | null) => void;
}

// SSR-safe store creation with proper error handling
export const useContentStore = create<ContentState>()(
  persist(
    (set, get) => ({
      // Initial state
      featuredContent: [],
      trendingContent: [],
      newReleases: [],
      originals: [],
      genres: [],
      currentContent: null,
      relatedContent: [],
      searchResults: [],
      searchSuggestions: [],
      searchLoading: false,
      searchQuery: '',
      continueWatching: [],
      recommendations: [],
      isLoading: false,
      error: null,

      // Fetch featured content
      fetchFeaturedContent: async () => {
        // Guard against SSR
        if (typeof window === 'undefined') return;
        
        try {
          set({ error: null });
          const response = await contentAPI.getFeatured();
          set({ featuredContent: response.data.data || [] });
        } catch (error: any) {
          console.error('Failed to fetch featured content:', error);
          set({ 
            error: error.response?.data?.message || 'Failed to fetch featured content',
            featuredContent: []
          });
        }
      },

      // Fetch trending content
      fetchTrendingContent: async () => {
        if (typeof window === 'undefined') return;
        
        try {
          const response = await contentAPI.getTrending();
          set({ trendingContent: response.data.data || [] });
        } catch (error: any) {
          console.error('Failed to fetch trending content:', error);
          set({ trendingContent: [] });
        }
      },

      // Fetch new releases
      fetchNewReleases: async () => {
        if (typeof window === 'undefined') return;
        
        try {
          const response = await contentAPI.getNewReleases();
          set({ newReleases: response.data.data || [] });
        } catch (error: any) {
          console.error('Failed to fetch new releases:', error);
          set({ newReleases: [] });
        }
      },

      // Fetch originals
      fetchOriginals: async () => {
        if (typeof window === 'undefined') return;
        
        try {
          const response = await contentAPI.getOriginals();
          set({ originals: response.data.data || [] });
        } catch (error: any) {
          console.error('Failed to fetch originals:', error);
          set({ originals: [] });
        }
      },

      // Fetch genres
      fetchGenres: async () => {
        if (typeof window === 'undefined') return;
        
        try {
          const response = await contentAPI.getGenres();
          set({ genres: response.data.data || [] });
        } catch (error: any) {
          console.error('Failed to fetch genres:', error);
          set({ genres: [] });
        }
      },

      // Fetch content by ID
      fetchContentById: async (id: string) => {
        if (typeof window === 'undefined') return;
        
        try {
          set({ isLoading: true, error: null });
          const response = await contentAPI.getById(id);
          set({
            currentContent: response.data.data || null,
            isLoading: false,
          });
          
          // Also fetch similar content
          get().fetchSimilarContent(id);
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch content';
          set({ 
            error: errorMessage, 
            isLoading: false,
            currentContent: null
          });
        }
      },

      // Fetch similar content
      fetchSimilarContent: async (id: string) => {
        if (typeof window === 'undefined') return;
        
        try {
          const response = await contentAPI.getSimilarContent(id, { limit: 10 });
          set({ relatedContent: response.data.data || [] });
        } catch (error: any) {
          console.error('Failed to fetch similar content:', error);
          set({ relatedContent: [] });
        }
      },

      // Fetch content by genre
      fetchContentByGenre: async (genre: string, params = {}) => {
        if (typeof window === 'undefined') return;
        
        try {
          set({ isLoading: true, error: null });
          const response = await contentAPI.getByGenre(genre, params);
          set({
            searchResults: response.data.data || [],
            isLoading: false,
            searchQuery: `Genre: ${genre}`,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || `Failed to fetch ${genre} content`;
          set({ 
            error: errorMessage, 
            isLoading: false,
            searchResults: []
          });
        }
      },

      // Search content (uses "q" parameter)
      searchContent: async (query: string, params = {}) => {
        if (typeof window === 'undefined') return;
        
        if (!query.trim()) {
          set({ searchResults: [], searchQuery: '' });
          return;
        }

        try {
          set({ searchLoading: true, error: null, searchQuery: query });
          const response = await contentAPI.search(query, params);
          set({ 
            searchResults: response.data.data || [],
            searchLoading: false 
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Search failed';
          set({ 
            error: errorMessage, 
            searchLoading: false,
            searchResults: []
          });
        }
      },

      // Fetch search suggestions
      fetchSearchSuggestions: async (query: string) => {
        if (typeof window === 'undefined') return;
        
        if (query.length < 2) {
          set({ searchSuggestions: [] });
          return;
        }
        
        try {
          const response = await contentAPI.getSearchSuggestions(query);
          set({ searchSuggestions: response.data.data || [] });
        } catch (error) {
          // Silently fail for suggestions
          set({ searchSuggestions: [] });
        }
      },

      // Fetch continue watching (requires auth)
      fetchContinueWatching: async () => {
        if (typeof window === 'undefined') return;
        
        try {
          const response = await contentAPI.getContinueWatching();
          set({ continueWatching: response.data.data || [] });
        } catch (error: any) {
          console.error('Failed to fetch continue watching:', error);
          set({ continueWatching: [] });
        }
      },

      // Fetch recommendations (requires auth)
      fetchRecommendations: async () => {
        if (typeof window === 'undefined') return;
        
        try {
          const response = await recommendationsAPI.getRecommendations();
          set({ recommendations: response.data.data || [] });
        } catch (error: any) {
          console.error('Failed to fetch recommendations:', error);
          set({ recommendations: [] });
        }
      },

      // Browse content with filters
      browseContent: async (params = {}) => {
        if (typeof window === 'undefined') return [];
        
        try {
          set({ isLoading: true, error: null });
          const response = await contentAPI.browse(params);
          const content = response.data.data || [];
          set({ isLoading: false });
          return content;
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to browse content';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          return [];
        }
      },

      // Utility actions
      clearSearch: () => set({ 
        searchResults: [], 
        searchSuggestions: [],
        searchLoading: false,
        searchQuery: ''
      }),
      
      clearError: () => set({ error: null }),
      
      setCurrentContent: (content: Content | null) => set({ currentContent: content }),
    }),
    {
      name: 'content-storage',
      partialize: (state) => ({
        genres: state.genres,
        continueWatching: state.continueWatching,
      }),
      // SSR-safe storage
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null;
          try {
            return JSON.parse(localStorage.getItem(name) || 'null');
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          if (typeof window === 'undefined') return;
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch {
            // Ignore storage errors
          }
        },
        removeItem: (name) => {
          if (typeof window === 'undefined') return;
          try {
            localStorage.removeItem(name);
          } catch {
            // Ignore storage errors
          }
        },
      },
    }
  )
);