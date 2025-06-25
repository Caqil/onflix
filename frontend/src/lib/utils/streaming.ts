
import { VIDEO_QUALITIES } from './constants';

export interface VideoQuality {
  key: string;
  label: string;
  resolution: string;
  bitrate: number;
}

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  quality: string;
  isFullscreen: boolean;
  isLoading: boolean;
  isMuted: boolean;
  playbackRate: number;
}

export interface SubtitleTrack {
  language: string;
  label: string;
  src: string;
  default?: boolean;
}

// Quality management
export const getAvailableQualities = (): VideoQuality[] => {
  return [
    { key: 'auto', label: 'Auto', resolution: 'Auto', bitrate: 0 },
    { key: '480p', label: 'SD', resolution: '480p', bitrate: 1000 },
    { key: '720p', label: 'HD', resolution: '720p', bitrate: 2500 },
    { key: '1080p', label: 'Full HD', resolution: '1080p', bitrate: 5000 },
    { key: '4k', label: '4K', resolution: '4K', bitrate: 15000 },
  ];
};

export const getBestQualityForBandwidth = (bandwidth: number): string => {
  if (bandwidth > 10000) return '4k';
  if (bandwidth > 4000) return '1080p';
  if (bandwidth > 2000) return '720p';
  if (bandwidth > 800) return '480p';
  return 'auto';
};

export const getQualityBitrate = (quality: string): number => {
  const qualityMap: Record<string, number> = {
    '480p': 1000,
    '720p': 2500,
    '1080p': 5000,
    '4k': 15000,
  };
  return qualityMap[quality] || 0;
};

// Time formatting for video player
export const formatVideoTime = (seconds: number): string => {
  if (isNaN(seconds)) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

// Progress calculation
export const calculateProgress = (currentTime: number, duration: number): number => {
  if (!duration || duration === 0) return 0;
  return Math.min((currentTime / duration) * 100, 100);
};

export const getTimeFromProgress = (progress: number, duration: number): number => {
  return (progress / 100) * duration;
};

// Watch progress utilities
export const shouldMarkAsWatched = (currentTime: number, duration: number): boolean => {
  if (!duration) return false;
  const progressPercent = (currentTime / duration) * 100;
  return progressPercent >= 90; // Mark as watched if 90% or more is viewed
};

export const getResumeTime = (watchProgress: number, duration: number): number => {
  const progressSeconds = (watchProgress / 100) * duration;
  // Don't resume if less than 5% or more than 95% watched
  if (watchProgress < 5 || watchProgress > 95) return 0;
  return progressSeconds;
};

// HLS/DASH utilities
export const isHLSSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const video = document.createElement('video');
  return video.canPlayType('application/vnd.apple.mpegurl') !== '';
};

export const isDASHSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'MediaSource' in window;
};

export const getOptimalStreamingFormat = (): 'hls' | 'dash' | 'mp4' => {
  if (isDASHSupported()) return 'dash';
  if (isHLSSupported()) return 'hls';
  return 'mp4';
};

// Bandwidth detection
export const detectBandwidth = async (): Promise<number> => {
  if (typeof window === 'undefined') return 1000;
  
  try {
    // Use Connection API if available
    const connection = (navigator as any).connection;
    if (connection && connection.downlink) {
      return connection.downlink * 1000; // Convert Mbps to Kbps
    }
    
    // Fallback: simple bandwidth test
    const startTime = performance.now();
    const response = await fetch('/api/bandwidth-test?size=1mb', { 
      cache: 'no-cache' 
    });
    await response.blob();
    const endTime = performance.now();
    
    const duration = (endTime - startTime) / 1000; // Convert to seconds
    const bitsLoaded = 1024 * 1024 * 8; // 1MB in bits
    const bandwidth = bitsLoaded / duration / 1000; // Kbps
    
    return Math.round(bandwidth);
  } catch {
    return 1000; // Default fallback
  }
};

// Error handling for video player
export const getVideoErrorMessage = (error: any): string => {
  if (!error) return 'Unknown error occurred';
  
  const errorMessages: Record<number, string> = {
    1: 'The video loading was aborted',
    2: 'A network error occurred while loading the video',
    3: 'An error occurred while decoding the video',
    4: 'The video format is not supported',
  };
  
  return errorMessages[error.code] || error.message || 'Video playback error';
};

// Subtitle utilities
export const parseSubtitleLanguage = (language: string): string => {
  const languageMap: Record<string, string> = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'ar': 'Arabic',
    'hi': 'Hindi',
  };
  
  return languageMap[language] || language.toUpperCase();
};

export const formatSubtitleTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const milliseconds = Math.floor((secs % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${Math.floor(secs).toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
};