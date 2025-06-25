import apiClient, { ApiResponse } from './client';

export interface Content {
  id: string;
  title: string;
  description: string;
  type: 'movie' | 'tv_show';
  genre: string[];
  release_date: string;
  poster_url: string;
  backdrop_url: string;
  rating: number;
  duration?: number; // for movies
  cast?: string[];
  director?: string;
  trailer_url?: string;
  seasons?: Season[]; // for TV shows
}

export interface Season {
  season_number: number;
  episode_count: number;
  release_date: string;
  poster_url: string;
  episodes?: Episode[];
}

export interface Episode {
  episode_number: number;
  title: string;
  description: string;
  duration: number;
  air_date: string;
  thumbnail_url?: string;
}

export interface ContentFilters {
  page?: number;
  limit?: number;
  genre?: string;
  type?: 'movie' | 'tv_show';
  sort?: 'title' | 'rating' | 'release_date' | 'popularity';
  order?: 'asc' | 'desc';
}

export interface SearchParams {
  q: string;
  page?: number;
  limit?: number;
  type?: 'movie' | 'tv_show';
}

export interface StreamingResponse {
  streaming_url: string;
  video_info: {
    duration: number;
    quality: string;
    format: string;
    bitrate?: string;
  };
}

export interface StreamingToken {
  token: string;
  expires_at: string;
}

export interface DownloadResponse {
  download_id: string;
  download_url: string;
  expires_at: string;
  file_size: string;
}

export interface Download {
  id: string;
  content_id: string;
  title: string;
  quality: string;
  file_size: string;
  downloaded_at: string;
  expires_at: string;
}

export interface Subtitle {
  language: string;
  label: string;
  url: string;
}

export interface WatchProgress {
  progress: number;
  duration: number;
}

export interface RatingRequest {
  rating: number; // 1-5
}

export interface ReviewRequest {
  title: string;
  comment: string;
  rating: number;
}

class ContentAPI {
  // Public content endpoints
  async browseContent(filters?: ContentFilters): Promise<ApiResponse<Content[]>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return apiClient.get(`/api/v1/content?${params.toString()}`);
  }

  async getContentById(id: string): Promise<ApiResponse<Content>> {
    return apiClient.get(`/api/v1/content/${id}`);
  }

  async getFeaturedContent(): Promise<ApiResponse<Content[]>> {
    return apiClient.get('/api/v1/content/featured');
  }

  async getTrendingContent(): Promise<ApiResponse<Content[]>> {
    return apiClient.get('/api/v1/content/trending');
  }

  async getNewReleases(): Promise<ApiResponse<Content[]>> {
    return apiClient.get('/api/v1/content/new-releases');
  }

  async searchContent(params: SearchParams): Promise<ApiResponse<Content[]>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, value.toString());
    });
    return apiClient.get(`/api/v1/content/search?${searchParams.toString()}`);
  }

  async getContentByGenre(genre: string, page = 1, limit = 20): Promise<ApiResponse<Content[]>> {
    return apiClient.get(`/api/v1/content/genres/${genre}?page=${page}&limit=${limit}`);
  }

  async getTVShowSeasons(showId: string): Promise<ApiResponse<Season[]>> {
    return apiClient.get(`/api/v1/content/tv-shows/${showId}/seasons`);
  }

  // Protected content endpoints (require authentication)
  async streamContent(contentId: string): Promise<ApiResponse<StreamingResponse>> {
    return apiClient.get(`/api/v1/content/${contentId}/stream`);
  }

  async streamContentWithQuality(contentId: string, quality: string): Promise<ApiResponse<StreamingResponse>> {
    return apiClient.get(`/api/v1/content/${contentId}/stream/${quality}`);
  }

  async getStreamingToken(contentId: string): Promise<ApiResponse<StreamingToken>> {
    return apiClient.post(`/api/v1/content/${contentId}/stream/token`);
  }

  async streamTVShowEpisode(
    showId: string,
    seasonNumber: number,
    episodeNumber: number
  ): Promise<ApiResponse<StreamingResponse>> {
    return apiClient.get(`/api/v1/content/tv-shows/${showId}/seasons/${seasonNumber}/episodes/${episodeNumber}/stream`);
  }

  async downloadContent(contentId: string, quality: string): Promise<ApiResponse<DownloadResponse>> {
    return apiClient.post(`/api/v1/content/${contentId}/download`, { quality });
  }

  async getUserDownloads(): Promise<ApiResponse<Download[]>> {
    return apiClient.get('/api/v1/content/downloads');
  }

  async removeDownload(downloadId: string): Promise<ApiResponse> {
    return apiClient.delete(`/api/v1/content/downloads/${downloadId}`);
  }

  async getSubtitles(contentId: string): Promise<ApiResponse<Subtitle[]>> {
    return apiClient.get(`/api/v1/content/${contentId}/subtitles`);
  }

  async getSubtitleFile(contentId: string, language: string): Promise<string> {
    const response = await apiClient.get(`/api/v1/content/${contentId}/subtitles/${language}`);
    return response.data;
  }

  async rateContent(contentId: string, rating: RatingRequest): Promise<ApiResponse> {
    return apiClient.post(`/api/v1/content/${contentId}/rate`, rating);
  }

  async addReview(contentId: string, review: ReviewRequest): Promise<ApiResponse> {
    return apiClient.post(`/api/v1/content/${contentId}/review`, review);
  }

  async updateWatchProgress(contentId: string, progress: WatchProgress): Promise<ApiResponse> {
    return apiClient.post(`/api/v1/content/${contentId}/watch-progress`, progress);
  }
}

const contentAPI = new ContentAPI();
export default contentAPI;

