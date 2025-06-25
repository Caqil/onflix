import { ApiResponse } from '@/types/api';
import { Content, ContentFilters, SearchParams, Season } from '@/types/content';
import apiClient from './client';
import { Download, DownloadResponse, StreamingResponse, StreamingToken, Subtitle, WatchProgress } from './streaming';



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
    return response.data as string;
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

