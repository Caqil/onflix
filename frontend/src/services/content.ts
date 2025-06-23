import { apiService, ApiResponse } from './api';

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: 'movie' | 'tv_show' | 'documentary' | 'short_film';
  genre: string[];
  releaseDate: string;
  duration: number; // in minutes
  rating: number;
  poster: string;
  backdrop: string;
  trailer?: string;
  cast: Actor[];
  director: string[];
  producer: string[];
  writer: string[];
  language: string;
  country: string;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  trending: boolean;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  seasons?: Season[]; // For TV shows
  episodes?: Episode[]; // For TV shows
  watchProgress?: {
    watched: boolean;
    progress: number; // percentage
    lastWatched: string;
  };
}

export interface Actor {
  id: string;
  name: string;
  character: string;
  avatar?: string;
}

export interface Season {
  id: string;
  title: string;
  seasonNumber: number;
  description: string;
  poster: string;
  releaseDate: string;
  episodes: Episode[];
}

export interface Episode {
  id: string;
  title: string;
  description: string;
  episodeNumber: number;
  seasonNumber: number;
  duration: number;
  releaseDate: string;
  thumbnail: string;
  videoUrl: string;
  watchProgress?: {
    watched: boolean;
    progress: number;
    lastWatched: string;
  };
}

export interface ContentFilters {
  type?: string[];
  genre?: string[];
  language?: string[];
  year?: number[];
  rating?: {
    min: number;
    max: number;
  };
  duration?: {
    min: number;
    max: number;
  };
  featured?: boolean;
  trending?: boolean;
}

export interface ContentSearchParams {
  query?: string;
  page?: number;
  limit?: number;
  sortBy?: 'title' | 'releaseDate' | 'rating' | 'viewCount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  filters?: ContentFilters;
}

export interface WatchlistItem {
  id: string;
  contentId: string;
  content: ContentItem;
  addedAt: string;
}

export interface ViewingHistory {
  id: string;
  contentId: string;
  content: ContentItem;
  watchedAt: string;
  progress: number;
  completed: boolean;
}

class ContentService {
  // Content browsing
  async getContent(params: ContentSearchParams = {}): Promise<ApiResponse<ContentItem[]>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'filters' && typeof value === 'object') {
          queryParams.append('filters', JSON.stringify(value));
        } else {
          queryParams.append(key, String(value));
        }
      }
    });

    return apiService.get(`/content?${queryParams.toString()}`);
  }

  async getContentById(id: string): Promise<ContentItem> {
    const response = await apiService.get<ContentItem>(`/content/${id}`);
    return response.data;
  }

  async getFeaturedContent(): Promise<ContentItem[]> {
    const response = await apiService.get<ContentItem[]>('/content/featured');
    return response.data;
  }

  async getTrendingContent(): Promise<ContentItem[]> {
    const response = await apiService.get<ContentItem[]>('/content/trending');
    return response.data;
  }

  async getRecentlyAdded(): Promise<ContentItem[]> {
    const response = await apiService.get<ContentItem[]>('/content/recent');
    return response.data;
  }

  async getRecommendations(contentId?: string): Promise<ContentItem[]> {
    const url = contentId ? `/content/recommendations/${contentId}` : '/content/recommendations';
    const response = await apiService.get<ContentItem[]>(url);
    return response.data;
  }

  async getContinueWatching(): Promise<ContentItem[]> {
    const response = await apiService.get<ContentItem[]>('/content/continue-watching');
    return response.data;
  }

  // Search
  async searchContent(query: string, params: Omit<ContentSearchParams, 'query'> = {}): Promise<ApiResponse<ContentItem[]>> {
    return this.getContent({ ...params, query });
  }

  async getSearchSuggestions(query: string): Promise<string[]> {
    const response = await apiService.get<string[]>(`/content/search/suggestions?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  // Genres and categories
  async getGenres(): Promise<Array<{ id: string; name: string; count: number }>> {
    const response = await apiService.get<Array<{ id: string; name: string; count: number }>>('/content/genres');
    return response.data;
  }

  async getContentByGenre(genre: string, params: ContentSearchParams = {}): Promise<ApiResponse<ContentItem[]>> {
    return this.getContent({ ...params, filters: { ...params.filters, genre: [genre] } });
  }

  // Watchlist management
  async getWatchlist(): Promise<WatchlistItem[]> {
    const response = await apiService.get<WatchlistItem[]>('/user/watchlist');
    return response.data;
  }

  async addToWatchlist(contentId: string): Promise<void> {
    await apiService.post('/user/watchlist', { contentId });
  }

  async removeFromWatchlist(contentId: string): Promise<void> {
    await apiService.delete(`/user/watchlist/${contentId}`);
  }

  async isInWatchlist(contentId: string): Promise<boolean> {
    try {
      const response = await apiService.get<{ inWatchlist: boolean }>(`/user/watchlist/check/${contentId}`);
      return response.data.inWatchlist;
    } catch {
      return false;
    }
  }

  // Viewing history
  async getViewingHistory(): Promise<ViewingHistory[]> {
    const response = await apiService.get<ViewingHistory[]>('/user/history');
    return response.data;
  }

  async recordView(contentId: string, progress: number): Promise<void> {
    await apiService.post('/user/history', { contentId, progress });
  }

  async updateWatchProgress(contentId: string, progress: number, episodeId?: string): Promise<void> {
    const data: any = { contentId, progress };
    if (episodeId) {
      data.episodeId = episodeId;
    }
    await apiService.patch('/user/watch-progress', data);
  }

  async markAsWatched(contentId: string, episodeId?: string): Promise<void> {
    const data: any = { contentId };
    if (episodeId) {
      data.episodeId = episodeId;
    }
    await apiService.post('/user/watched', data);
  }

  async removeFromHistory(historyId: string): Promise<void> {
    await apiService.delete(`/user/history/${historyId}`);
  }

  // Ratings and reviews
  async rateContent(contentId: string, rating: number): Promise<void> {
    await apiService.post('/user/ratings', { contentId, rating });
  }

  async getContentRating(contentId: string): Promise<{ userRating?: number; averageRating: number; totalRatings: number }> {
    const response = await apiService.get<{ userRating?: number; averageRating: number; totalRatings: number }>(`/content/${contentId}/rating`);
    return response.data;
  }

  async addReview(contentId: string, review: string, rating: number): Promise<void> {
    await apiService.post('/user/reviews', { contentId, review, rating });
  }

  async getReviews(contentId: string, page = 1, limit = 10): Promise<ApiResponse<Array<{
    id: string;
    user: { name: string; avatar?: string };
    review: string;
    rating: number;
    createdAt: string;
  }>>> {
    return apiService.get(`/content/${contentId}/reviews?page=${page}&limit=${limit}`);
  }

  // Video streaming
  async getStreamUrl(contentId: string, episodeId?: string, quality?: string): Promise<{
    streamUrl: string;
    subtitles: Array<{ language: string; url: string }>;
    qualities: string[];
  }> {
    const params = new URLSearchParams();
    if (episodeId) params.append('episodeId', episodeId);
    if (quality) params.append('quality', quality);
    
    const response = await apiService.get<{
      streamUrl: string;
      subtitles: Array<{ language: string; url: string }>;
      qualities: string[];
    }>(`/content/${contentId}/stream?${params.toString()}`);
    return response.data;
  }

  // TV Show specific methods
  async getSeasons(contentId: string): Promise<Season[]> {
    const response = await apiService.get<Season[]>(`/content/${contentId}/seasons`);
    return response.data;
  }

  async getEpisodes(contentId: string, seasonNumber: number): Promise<Episode[]> {
    const response = await apiService.get<Episode[]>(`/content/${contentId}/seasons/${seasonNumber}/episodes`);
    return response.data;
  }

  async getEpisode(contentId: string, seasonNumber: number, episodeNumber: number): Promise<Episode> {
    const response = await apiService.get<Episode>(`/content/${contentId}/seasons/${seasonNumber}/episodes/${episodeNumber}`);
    return response.data;
  }

  // Content analytics (for admins)
  async getContentAnalytics(contentId: string): Promise<{
    views: number;
    uniqueViews: number;
    averageWatchTime: number;
    completionRate: number;
    ratings: { average: number; total: number };
    demographics: any;
  }> {
    const response = await apiService.get(`/admin/content/${contentId}/analytics`);
    return response.data as {
      views: number;
      uniqueViews: number;
      averageWatchTime: number;
      completionRate: number;
      ratings: { average: number; total: number };
      demographics: any;
    };
  }
}

// Create and export a singleton instance
export const contentService = new ContentService();
export default contentService;