import { Content, ContentType, DownloadStatus, VideoFormat, VideoQuality, VideoResolution } from ".";

export interface StreamingResponse {
  streaming_url: string;
  video_info: VideoInfo;
  content?: Content;
  session_id?: string;
}

export interface VideoInfo {
  duration: number;
  quality: VideoQuality;
  format: VideoFormat;
  bitrate?: number;
  resolution?: VideoResolution;
  codec?: string;
  file_size?: number;
}

export interface StreamingToken {
  token: string;
  expires_at: string;
  content_id: string;
  user_id: string;
  quality: VideoQuality;
}

export interface QualityOption {
  key: VideoQuality;
  label: string;
  resolution: VideoResolution;
  bitrate: number;
  file_size?: string;
  available: boolean;
}

// Player state
export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  quality: VideoQuality;
  isFullscreen: boolean;
  isLoading: boolean;
  isMuted: boolean;
  playbackRate: number;
  isBuffering: boolean;
  error: string | null;
}

export interface PlayerControls {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setQuality: (quality: VideoQuality) => void;
  toggleFullscreen: () => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
}

// Download management
export interface DownloadRequest {
  content_id: string;
  quality: VideoQuality;
  season_number?: number;
  episode_number?: number;
}

export interface Download {
  id: string;
  content_id: string;
  title: string;
  type: ContentType;
  quality: VideoQuality;
  file_size: string;
  progress: number; // 0-100
  status: DownloadStatus;
  downloaded_at?: string;
  expires_at: string;
  file_path?: string;
  season_number?: number;
  episode_number?: number;
}

// Subtitle types
export interface Subtitle {
  language: string;
  label: string;
  url: string;
  default?: boolean;
}

export interface SubtitleTrack {
  language: string;
  label: string;
  src: string;
  default: boolean;
  kind: 'subtitles' | 'captions';
}

// Playback session
export interface PlaybackSession {
  session_id: string;
  content_id: string;
  user_id: string;
  started_at: string;
  current_time: number;
  quality: VideoQuality;
  device_info: DeviceInfo;
  bandwidth?: number;
  last_heartbeat: string;
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop' | 'tv';
  os: string;
  browser: string;
  ip_address?: string;
  location?: string;
}

export interface DownloadResponse {
  download_id: string;
  download_url: string;
  expires_at: string;
  file_size: string;
  quality: string;
  format: string;
}

export interface StreamingTokenResponse {
  token: string;
  expires_at: string;
}

export interface ContentAnalyticsResponse {
  content_id: string;
  total_views: number;
  unique_viewers: number;
  average_watch_time: number;
  completion_rate: number;
  ratings_average: number;
  ratings_count: number;
  reviews_count: number;
  downloads_count: number;
}