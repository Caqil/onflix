import apiClient, { ApiResponse } from './client';

export interface StreamingResponse {
  streaming_url: string;
  video_info: {
    duration: number;
    quality: string;
    format: string;
    bitrate?: string;
  };
  content?: any;
}

export interface StreamingToken {
  token: string;
  expires_at: string;
}

export interface QualityOption {
  quality: string;
  resolution: string;
  bitrate: string;
  file_size?: string;
}

export interface DownloadRequest {
  quality: string;
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
  progress?: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
}

export interface Subtitle {
  language: string;
  label: string;
  url: string;
}

export interface PlaybackSession {
  session_id: string;
  content_id: string;
  user_id: string;
  started_at: string;
  current_time: number;
  quality: string;
  device_info: {
    type: string;
    os: string;
    browser: string;
  };
}

export interface WatchProgress {
  content_id: string;
  progress: number;
  duration: number;
  last_updated: string;
}

class StreamingAPI {
  // Video Streaming
  async streamContent(contentId: string): Promise<ApiResponse<StreamingResponse>> {
    return apiClient.get(`/api/v1/content/${contentId}/stream`);
  }

  async streamWithQuality(contentId: string, quality: string): Promise<ApiResponse<StreamingResponse>> {
    return apiClient.get(`/api/v1/content/${contentId}/stream/${quality}`);
  }

  async getStreamingToken(contentId: string): Promise<ApiResponse<StreamingToken>> {
    return apiClient.post(`/api/v1/content/${contentId}/stream/token`);
  }

  async streamEpisode(
    showId: string,
    seasonNumber: number,
    episodeNumber: number
  ): Promise<ApiResponse<StreamingResponse>> {
    return apiClient.get(`/api/v1/content/tv-shows/${showId}/seasons/${seasonNumber}/episodes/${episodeNumber}/stream`);
  }

  async getAvailableQualities(contentId: string): Promise<ApiResponse<QualityOption[]>> {
    return apiClient.get(`/api/v1/content/${contentId}/qualities`);
  }

  // Download Management
  async downloadContent(contentId: string, quality: string): Promise<ApiResponse<DownloadResponse>> {
    return apiClient.post(`/api/v1/content/${contentId}/download`, { quality });
  }

  async getUserDownloads(): Promise<ApiResponse<Download[]>> {
    return apiClient.get('/api/v1/content/downloads');
  }

  async getDownloadById(downloadId: string): Promise<ApiResponse<Download>> {
    return apiClient.get(`/api/v1/content/downloads/${downloadId}`);
  }

  async removeDownload(downloadId: string): Promise<ApiResponse> {
    return apiClient.delete(`/api/v1/content/downloads/${downloadId}`);
  }

  async pauseDownload(downloadId: string): Promise<ApiResponse> {
    return apiClient.post(`/api/v1/content/downloads/${downloadId}/pause`);
  }

  async resumeDownload(downloadId: string): Promise<ApiResponse> {
    return apiClient.post(`/api/v1/content/downloads/${downloadId}/resume`);
  }

  // Subtitle Management
  async getSubtitles(contentId: string): Promise<ApiResponse<Subtitle[]>> {
    return apiClient.get(`/api/v1/content/${contentId}/subtitles`);
  }

  async getSubtitleFile(contentId: string, language: string): Promise<string> {
    const response = await apiClient.get(`/api/v1/content/${contentId}/subtitles/${language}`);
    return response.data;
  }

  async uploadSubtitle(contentId: string, file: File, language: string): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('subtitle', file);
    formData.append('language', language);
    return apiClient.upload(`/api/v1/content/${contentId}/subtitles`, formData);
  }

  // Playback Session Management
  async startPlaybackSession(contentId: string, deviceInfo: any): Promise<ApiResponse<PlaybackSession>> {
    return apiClient.post('/api/v1/streaming/session/start', {
      content_id: contentId,
      device_info: deviceInfo,
    });
  }

  async updatePlaybackSession(sessionId: string, currentTime: number): Promise<ApiResponse> {
    return apiClient.put(`/api/v1/streaming/session/${sessionId}`, {
      current_time: currentTime,
    });
  }

  async endPlaybackSession(sessionId: string): Promise<ApiResponse> {
    return apiClient.post(`/api/v1/streaming/session/${sessionId}/end`);
  }

  // Watch Progress
  async updateWatchProgress(contentId: string, progress: number, duration: number): Promise<ApiResponse> {
    return apiClient.post(`/api/v1/content/${contentId}/watch-progress`, {
      progress,
      duration,
    });
  }

  async getWatchProgress(contentId: string): Promise<ApiResponse<WatchProgress>> {
    return apiClient.get(`/api/v1/content/${contentId}/watch-progress`);
  }

  async getAllWatchProgress(): Promise<ApiResponse<WatchProgress[]>> {
    return apiClient.get('/api/v1/user/watch-progress');
  }

  // Quality Control
  async switchQuality(sessionId: string, quality: string): Promise<ApiResponse> {
    return apiClient.post(`/api/v1/streaming/session/${sessionId}/quality`, {
      quality,
    });
  }

  // Bandwidth Management
  async reportBandwidth(sessionId: string, bandwidth: number): Promise<ApiResponse> {
    return apiClient.post(`/api/v1/streaming/session/${sessionId}/bandwidth`, {
      bandwidth,
    });
  }
}

const streamingAPI = new StreamingAPI();
export default streamingAPI;
