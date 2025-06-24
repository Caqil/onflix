import { create } from 'zustand';
import { contentAPI, recommendationsAPI, userAPI } from '@/lib/api';
import { Content, PaginationInfo, VideoQuality } from '@/lib/types';

interface ContentState {
  // Content Data
  contents: Content[];
  currentContent: Content | null;
  featuredContent: Content[];
  trendingContent: Content[];
  newReleases: Content[];
  originals: Content[];
  similarContent: Content[];
  searchResults: Content[];
  searchSuggestions: string[];
  
  // Categories & Genres
  genres: any[];
  categories: any[];
  
  // TV Show Data
  seasons: any[];
  currentSeason: any | null;
  episodes: any[];
  currentEpisode: any | null;
  
  // User Content Data
  watchlist: Content[];
  watchHistory: any[];
  continueWatching: Content[];
  downloads: any[];
  
  // Recommendations
  recommendations: Content[];
  trendingRecommendations: Content[];
  becauseYouWatched: Content[];
  
  // Reviews & Ratings
  reviews: any[];
  userRating: number | null;
  
  // Subtitles
  availableSubtitles: any[];
  
  // Streaming Data
  streamingUrl: string | null;
  streamingToken: string | null;
  videoInfo: any | null;
  
  // Pagination
  pagination: PaginationInfo | null;
  
  // Loading States
  isLoading: boolean;
  isLoadingContent: boolean;
  isLoadingSearch: boolean;
  isLoadingStream: boolean;
  
  // Error State
  error: string | null;
  
  // Actions - Content Browsing
  browseContent: (params?: { page?: number; limit?: number; genre?: string; type?: string }) => Promise<void>;
  loadFeaturedContent: () => Promise<void>;
  loadTrendingContent: () => Promise<void>;
  loadNewReleases: () => Promise<void>;
  loadOriginals: () => Promise<void>;
  loadContentById: (id: string) => Promise<Content | null>;
  loadSimilarContent: (id: string, limit?: number) => Promise<void>;
  
  // Actions - Search
  searchContent: (query: string, params?: { page?: number; limit?: number; type?: string; genre?: string }) => Promise<void>;
  getSearchSuggestions: (query: string) => Promise<void>;
  clearSearchResults: () => void;
  
  // Actions - Categories & Genres
  loadGenres: () => Promise<void>;
  loadCategories: () => Promise<void>;
  loadContentByGenre: (genre: string, params?: { page?: number; limit?: number }) => Promise<void>;
  loadContentByCategory: (category: string, params?: { page?: number; limit?: number }) => Promise<void>;
  
  // Actions - TV Shows
  loadSeasons: (showId: string) => Promise<void>;
  loadSeason: (showId: string, seasonNumber: number) => Promise<void>;
  loadEpisodes: (showId: string, seasonNumber: number) => Promise<void>;
  loadEpisode: (showId: string, seasonNumber: number, episodeNumber: number) => Promise<void>;
  
  // Actions - Streaming
  startStream: (contentId: string, quality?: VideoQuality) => Promise<string>;
  getStreamingToken: (contentId: string) => Promise<string>;
  streamEpisode: (showId: string, seasonNumber: number, episodeNumber: number) => Promise<string>;
  
  // Actions - Downloads
  downloadContent: (contentId: string, quality?: string) => Promise<void>;
  loadDownloads: () => Promise<void>;
  removeDownload: (downloadId: string) => Promise<void>;
  
  // Actions - Subtitles
  loadSubtitles: (contentId: string) => Promise<void>;
  getSubtitleFile: (contentId: string, language: string) => Promise<any>;
  
  // Actions - User Interactions
  likeContent: (contentId: string) => Promise<void>;
  unlikeContent: (contentId: string) => Promise<void>;
  rateContent: (contentId: string, rating: number) => Promise<void>;
  addReview: (contentId: string, review: { title?: string; comment: string; rating: number }) => Promise<void>;
  loadReviews: (contentId: string, params?: { page?: number; limit?: number }) => Promise<void>;
  
  // Actions - Watch Progress
  updateWatchProgress: (contentId: string, progress: number, duration: number) => Promise<void>;
  loadContinueWatching: () => Promise<void>;
  
  // Actions - Watchlist
  loadWatchlist: (profileId: string, params?: { page?: number; limit?: number }) => Promise<void>;
  addToWatchlist: (contentId: string, profileId: string) => Promise<void>;
  removeFromWatchlist: (contentId: string, profileId: string) => Promise<void>;
  clearWatchlist: (profileId: string) => Promise<void>;
  
  // Actions - Watch History
  loadWatchHistory: (profileId: string, params?: { page?: number; limit?: number }) => Promise<void>;
  removeFromHistory: (contentId: string, profileId: string) => Promise<void>;
  clearWatchHistory: (profileId: string) => Promise<void>;
  
  // Actions - Recommendations
  loadRecommendations: () => Promise<void>;
  loadTrendingRecommendations: () => Promise<void>;
  loadBecauseYouWatchedRecommendations: (contentId: string) => Promise<void>;
  submitRecommendationFeedback: (recommendationId: string, feedback: 'like' | 'dislike' | 'not_interested') => Promise<void>;
  
  // Utility
  clearError: () => void;
  setCurrentContent: (content: Content | null) => void;
}

export const useContentStore = create<ContentState>((set, get) => ({
  // Initial State
  contents: [],
  currentContent: null,
  featuredContent: [],
  trendingContent: [],
  newReleases: [],
  originals: [],
  similarContent: [],
  searchResults: [],
  searchSuggestions: [],
  genres: [],
  categories: [],
  seasons: [],
  currentSeason: null,
  episodes: [],
  currentEpisode: null,
  watchlist: [],
  watchHistory: [],
  continueWatching: [],
  downloads: [],
  recommendations: [],
  trendingRecommendations: [],
  becauseYouWatched: [],
  reviews: [],
  userRating: null,
  availableSubtitles: [],
  streamingUrl: null,
  streamingToken: null,
  videoInfo: null,
  pagination: null,
  isLoading: false,
  isLoadingContent: false,
  isLoadingSearch: false,
  isLoadingStream: false,
  error: null,

  // Content Browsing
  browseContent: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await contentAPI.browse(params);
      if (response.data.success) {
        set({
          contents: response.data.data || [],
          pagination: response.data.pagination,
          isLoading: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load content',
        isLoading: false
      });
    }
  },

  loadFeaturedContent: async () => {
    set({ isLoadingContent: true, error: null });
    try {
      const response = await contentAPI.getFeatured();
      if (response.data.success) {
        set({
          featuredContent: response.data.data || [],
          isLoadingContent: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load featured content',
        isLoadingContent: false
      });
    }
  },

  loadTrendingContent: async () => {
    set({ isLoadingContent: true, error: null });
    try {
      const response = await contentAPI.getTrending();
      if (response.data.success) {
        set({
          trendingContent: response.data.data || [],
          isLoadingContent: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load trending content',
        isLoadingContent: false
      });
    }
  },

  loadNewReleases: async () => {
    set({ isLoadingContent: true, error: null });
    try {
      const response = await contentAPI.getNewReleases();
      if (response.data.success) {
        set({
          newReleases: response.data.data || [],
          isLoadingContent: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load new releases',
        isLoadingContent: false
      });
    }
  },

  loadOriginals: async () => {
    set({ isLoadingContent: true, error: null });
    try {
      const response = await contentAPI.getOriginals();
      if (response.data.success) {
        set({
          originals: response.data.data || [],
          isLoadingContent: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load originals',
        isLoadingContent: false
      });
    }
  },

  loadContentById: async (id: string) => {
    set({ isLoadingContent: true, error: null });
    try {
      const response = await contentAPI.getById(id);
      if (response.data.success) {
        const content = response.data.data!;
        set({
          currentContent: content,
          isLoadingContent: false
        });
        return content;
      }
      return null;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load content',
        isLoadingContent: false
      });
      return null;
    }
  },

  loadSimilarContent: async (id: string, limit) => {
    set({ isLoadingContent: true, error: null });
    try {
      const response = await contentAPI.getSimilarContent(id, { limit });
      if (response.data.success) {
        set({
          similarContent: response.data.data || [],
          isLoadingContent: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load similar content',
        isLoadingContent: false
      });
    }
  },

  // Search
  searchContent: async (query: string, params) => {
    set({ isLoadingSearch: true, error: null });
    try {
      const response = await contentAPI.search(query, params);
      if (response.data.success) {
        set({
          searchResults: response.data.data || [],
          pagination: response.data.pagination,
          isLoadingSearch: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Search failed',
        isLoadingSearch: false
      });
    }
  },

  getSearchSuggestions: async (query: string) => {
    try {
      const response = await contentAPI.getSearchSuggestions(query);
      if (response.data.success) {
        set({ searchSuggestions: response.data.data || [] });
      }
    } catch (error) {
      // Silent fail for suggestions
      console.error('Failed to load search suggestions:', error);
    }
  },

  clearSearchResults: () => {
    set({ searchResults: [], searchSuggestions: [], pagination: null });
  },

  // Categories & Genres
  loadGenres: async () => {
    try {
      const response = await contentAPI.getGenres();
      if (response.data.success) {
        set({ genres: response.data.data || [] });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load genres' });
    }
  },

  loadCategories: async () => {
    try {
      const response = await contentAPI.getCategories();
      if (response.data.success) {
        set({ categories: response.data.data || [] });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load categories' });
    }
  },

  loadContentByGenre: async (genre: string, params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await contentAPI.getByGenre(genre, params);
      if (response.data.success) {
        set({
          contents: response.data.data || [],
          pagination: response.data.pagination,
          isLoading: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load content by genre',
        isLoading: false
      });
    }
  },

  loadContentByCategory: async (category: string, params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await contentAPI.getByCategory(category, params);
      if (response.data.success) {
        set({
          contents: response.data.data || [],
          pagination: response.data.pagination,
          isLoading: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load content by category',
        isLoading: false
      });
    }
  },

  // TV Shows
  loadSeasons: async (showId: string) => {
    set({ isLoadingContent: true, error: null });
    try {
      const response = await contentAPI.getSeasons(showId);
      if (response.data.success) {
        set({
          seasons: response.data.data || [],
          isLoadingContent: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load seasons',
        isLoadingContent: false
      });
    }
  },

  loadSeason: async (showId: string, seasonNumber: number) => {
    set({ isLoadingContent: true, error: null });
    try {
      const response = await contentAPI.getSeason(showId, seasonNumber);
      if (response.data.success) {
        set({
          currentSeason: response.data.data,
          isLoadingContent: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load season',
        isLoadingContent: false
      });
    }
  },

  loadEpisodes: async (showId: string, seasonNumber: number) => {
    set({ isLoadingContent: true, error: null });
    try {
      const response = await contentAPI.getEpisodes(showId, seasonNumber);
      if (response.data.success) {
        set({
          episodes: response.data.data || [],
          isLoadingContent: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load episodes',
        isLoadingContent: false
      });
    }
  },

  loadEpisode: async (showId: string, seasonNumber: number, episodeNumber: number) => {
    set({ isLoadingContent: true, error: null });
    try {
      const response = await contentAPI.getEpisode(showId, seasonNumber, episodeNumber);
      if (response.data.success) {
        set({
          currentEpisode: response.data.data,
          isLoadingContent: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load episode',
        isLoadingContent: false
      });
    }
  },

  // Streaming
  startStream: async (contentId: string, quality?: VideoQuality) => {
    set({ isLoadingStream: true, error: null });
    try {
      const response = quality 
        ? await contentAPI.streamWithQuality(contentId, quality)
        : await contentAPI.stream(contentId);
        
      if (response.data.success) {
        const data = response.data.data!;
        set({
          streamingUrl: data.streaming_url,
          videoInfo: data.video_info,
          isLoadingStream: false
        });
        return data.streaming_url;
      }
      throw new Error('Stream response was not successful');
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to start stream',
        isLoadingStream: false
      });
      throw error;
    }
  },

  getStreamingToken: async (contentId: string) => {
    try {
      const response = await contentAPI.getStreamingToken(contentId);
      if (response.data.success) {
        const token = response.data.data!.token;
        set({ streamingToken: token });
        return token;
      }
      throw new Error('Failed to get streaming token');
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to get streaming token' });
      throw error;
    }
  },

  streamEpisode: async (showId: string, seasonNumber: number, episodeNumber: number) => {
    set({ isLoadingStream: true, error: null });
    try {
      const response = await contentAPI.streamEpisode(showId, seasonNumber, episodeNumber);
      if (response.data.success) {
        const streamingUrl = response.data.data!.streaming_url;
        set({
          streamingUrl,
          isLoadingStream: false
        });
        return streamingUrl;
      }
      throw new Error('Episode stream response was not successful');
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to stream episode',
        isLoadingStream: false
      });
      throw error;
    }
  },

  // Downloads
  downloadContent: async (contentId: string, quality) => {
    set({ isLoading: true, error: null });
    try {
      const response = await contentAPI.downloadContent(contentId, quality);
      if (response.data.success) {
        // Refresh downloads list
        await get().loadDownloads();
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Download failed',
        isLoading: false
      });
      throw error;
    }
  },

  loadDownloads: async () => {
    try {
      const response = await contentAPI.getDownloads();
      if (response.data.success) {
        set({ downloads: response.data.data || [] });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load downloads' });
    }
  },

  removeDownload: async (downloadId: string) => {
    try {
      const response = await contentAPI.removeDownload(downloadId);
      if (response.data.success) {
        set(state => ({
          downloads: state.downloads.filter(d => d.id !== downloadId)
        }));
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to remove download' });
      throw error;
    }
  },

  // Subtitles
  loadSubtitles: async (contentId: string) => {
    try {
      const response = await contentAPI.getSubtitles(contentId);
      if (response.data.success) {
        set({ availableSubtitles: response.data.data || [] });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load subtitles' });
    }
  },

  getSubtitleFile: async (contentId: string, language: string) => {
    try {
      const response = await contentAPI.getSubtitleFile(contentId, language);
      return response;
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to get subtitle file' });
      throw error;
    }
  },

  // User Interactions
  likeContent: async (contentId: string) => {
    try {
      const response = await contentAPI.likeContent(contentId);
      if (response.data.success && get().currentContent?.id === contentId) {
        set(state => ({
          currentContent: state.currentContent ? {
            ...state.currentContent,
            is_liked: true
          } : null
        }));
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to like content' });
      throw error;
    }
  },

  unlikeContent: async (contentId: string) => {
    try {
      const response = await contentAPI.unlikeContent(contentId);
      if (response.data.success && get().currentContent?.id === contentId) {
        set(state => ({
          currentContent: state.currentContent ? {
            ...state.currentContent,
            is_liked: false
          } : null
        }));
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to unlike content' });
      throw error;
    }
  },

  rateContent: async (contentId: string, rating: number) => {
    try {
      const response = await contentAPI.rateContent(contentId, rating);
      if (response.data.success) {
        set({ userRating: rating });
        if (get().currentContent?.id === contentId) {
          set(state => ({
            currentContent: state.currentContent ? {
              ...state.currentContent,
              user_rating: rating
            } : null
          }));
        }
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to rate content' });
      throw error;
    }
  },

  addReview: async (contentId: string, review) => {
    set({ isLoading: true, error: null });
    try {
      const response = await contentAPI.addReview(contentId, review);
      if (response.data.success) {
        // Refresh reviews
        await get().loadReviews(contentId);
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to add review',
        isLoading: false
      });
      throw error;
    }
  },

  loadReviews: async (contentId: string, params) => {
    try {
      const response = await contentAPI.getReviews(contentId, params);
      if (response.data.success) {
        set({
          reviews: response.data.data || [],
          pagination: response.data.pagination
        });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load reviews' });
    }
  },

  // Watch Progress
  updateWatchProgress: async (contentId: string, progress: number, duration: number) => {
    try {
      const response = await contentAPI.updateWatchProgress(contentId, progress, duration);
      if (response.data.success) {
        // Update continue watching if needed
        await get().loadContinueWatching();
      }
    } catch (error: any) {
      console.error('Failed to update watch progress:', error);
    }
  },

  loadContinueWatching: async () => {
    try {
      const response = await contentAPI.getContinueWatching();
      if (response.data.success) {
        set({ continueWatching: response.data.data || [] });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load continue watching' });
    }
  },

  // Watchlist
  loadWatchlist: async (profileId: string, params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await userAPI.getWatchlist(profileId, params);
      if (response.data.success) {
        set({
          watchlist: response.data.data || [],
          isLoading: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load watchlist',
        isLoading: false
      });
    }
  },

  addToWatchlist: async (contentId: string, profileId: string) => {
    try {
      const response = await userAPI.addToWatchlist(contentId, profileId);
      if (response.data.success) {
        // Refresh watchlist
        await get().loadWatchlist(profileId);
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to add to watchlist' });
      throw error;
    }
  },

  removeFromWatchlist: async (contentId: string, profileId: string) => {
    try {
      const response = await userAPI.removeFromWatchlist(contentId, profileId);
      if (response.data.success) {
        set(state => ({
          watchlist: state.watchlist.filter(c => c.id !== contentId)
        }));
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to remove from watchlist' });
      throw error;
    }
  },

  clearWatchlist: async (profileId: string) => {
    try {
      const response = await userAPI.clearWatchlist(profileId);
      if (response.data.success) {
        set({ watchlist: [] });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to clear watchlist' });
      throw error;
    }
  },

  // Watch History
  loadWatchHistory: async (profileId: string, params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await userAPI.getWatchHistory(profileId, params);
      if (response.data.success) {
        set({
          watchHistory: response.data.data || [],
          isLoading: false
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load watch history',
        isLoading: false
      });
    }
  },

  removeFromHistory: async (contentId: string, profileId: string) => {
    try {
      const response = await userAPI.removeFromHistory(contentId, profileId);
      if (response.data.success) {
        set(state => ({
          watchHistory: state.watchHistory.filter(h => h.content_id !== contentId)
        }));
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to remove from history' });
      throw error;
    }
  },

  clearWatchHistory: async (profileId: string) => {
    try {
      const response = await userAPI.clearWatchHistory(profileId);
      if (response.data.success) {
        set({ watchHistory: [] });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to clear watch history' });
      throw error;
    }
  },

  // Recommendations
  loadRecommendations: async () => {
    try {
      const response = await recommendationsAPI.getRecommendations();
      if (response.data.success) {
        set({ recommendations: response.data.data || [] });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load recommendations' });
    }
  },

  loadTrendingRecommendations: async () => {
    try {
      const response = await recommendationsAPI.getTrendingRecommendations();
      if (response.data.success) {
        set({ trendingRecommendations: response.data.data || [] });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load trending recommendations' });
    }
  },

  loadBecauseYouWatchedRecommendations: async (contentId: string) => {
    try {
      const response = await recommendationsAPI.getBecauseYouWatchedRecommendations(contentId);
      if (response.data.success) {
        set({ becauseYouWatched: response.data.data || [] });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load recommendations' });
    }
  },

  submitRecommendationFeedback: async (recommendationId: string, feedback: 'like' | 'dislike' | 'not_interested') => {
    try {
      const response = await recommendationsAPI.submitRecommendationFeedback({
        recommendation_id: recommendationId,
        feedback
      });
      if (response.data.success) {
        // Could refresh recommendations here if needed
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to submit feedback' });
      throw error;
    }
  },

  // Utility
  clearError: () => set({ error: null }),
  setCurrentContent: (content: Content | null) => set({ currentContent: content }),
}));