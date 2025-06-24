import { useState, useCallback, useRef, useEffect } from 'react';
import streamingAPI from '@/lib/api/streaming';
import { formatVideoTime, calculateProgress } from '@/lib/utils/streaming';
import type { 
  PlayerState, 
  PlayerControls, 
  StreamingResponse, 
  VideoQuality, 
  SubtitleTrack,
  PlaybackSession 
} from '@/types';

interface UseStreamingOptions {
  contentId: string;
  quality?: VideoQuality;
  autoPlay?: boolean;
  onProgress?: (progress: number, duration: number) => void;
  onQualityChange?: (quality: VideoQuality) => void;
  onError?: (error: string) => void;
}

export const useStreaming = (options: UseStreamingOptions) => {
  const {
    contentId,
    quality = 'auto',
    autoPlay = false,
    onProgress,
    onQualityChange,
    onError,
  } = options;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamingData, setStreamingData] = useState<StreamingResponse | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [session, setSession] = useState<PlaybackSession | null>(null);

  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    quality: quality,
    isFullscreen: false,
    isLoading: true,
    isMuted: false,
    playbackRate: 1,
    isBuffering: false,
    error: null,
  });

  // Initialize streaming
  const initializeStream = useCallback(async () => {
    try {
      setPlayerState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await streamingAPI.streamContent(contentId);
      if (response.success && response.data) {
        setStreamingData(response.data);
        setIsInitialized(true);
      } else {
        throw new Error(response.message || 'Failed to initialize stream');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to initialize stream';
      setPlayerState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      onError?.(errorMessage);
    }
  }, [contentId, onError]);

  // Player controls
  const play = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setPlayerState(prev => ({ ...prev, isPlaying: true }));
      }).catch(error => {
        onError?.(error.message);
      });
    }
  }, [onError]);

  const pause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setPlayerState(prev => ({ ...prev, currentTime: time }));
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = Math.max(0, Math.min(1, volume));
      setPlayerState(prev => ({ 
        ...prev, 
        volume, 
        isMuted: volume === 0 
      }));
    }
  }, []);

  const setQuality = useCallback(async (newQuality: VideoQuality) => {
    try {
      setPlayerState(prev => ({ ...prev, isLoading: true }));
      
      const response = await streamingAPI.streamWithQuality(contentId, newQuality);
      if (response.success && response.data) {
        setStreamingData(response.data);
        setPlayerState(prev => ({ 
          ...prev, 
          quality: newQuality, 
          isLoading: false 
        }));
        onQualityChange?.(newQuality);
      }
    } catch (error: any) {
      setPlayerState(prev => ({ ...prev, isLoading: false }));
      onError?.(error.message || 'Failed to change quality');
    }
  }, [contentId, onQualityChange, onError]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setPlayerState(prev => ({ ...prev, isFullscreen: true }));
    } else {
      document.exitFullscreen();
      setPlayerState(prev => ({ ...prev, isFullscreen: false }));
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setPlayerState(prev => ({ ...prev, isMuted: !prev.isMuted }));
    }
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlayerState(prev => ({ ...prev, playbackRate: rate }));
    }
  }, []);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      const duration = video.duration;
      
      setPlayerState(prev => ({ ...prev, currentTime, duration }));
      onProgress?.(currentTime, duration);
    };

    const handleLoadedMetadata = () => {
      setPlayerState(prev => ({ 
        ...prev, 
        duration: video.duration,
        isLoading: false 
      }));
    };

    const handleWaiting = () => {
      setPlayerState(prev => ({ ...prev, isBuffering: true }));
    };

    const handleCanPlay = () => {
      setPlayerState(prev => ({ ...prev, isBuffering: false, isLoading: false }));
      
      if (autoPlay) {
        play();
      }
    };

    const handleError = () => {
      const error = video.error;
      const errorMessage = error ? `Video error: ${error.message}` : 'Video playback error';
      setPlayerState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      onError?.(errorMessage);
    };

    const handleEnded = () => {
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('ended', handleEnded);
    };
  }, [autoPlay, play, onProgress, onError]);

  // Initialize stream on mount
  useEffect(() => {
    if (contentId) {
      initializeStream();
    }
  }, [contentId, initializeStream]);

  const controls: PlayerControls = {
    play,
    pause,
    seek,
    setVolume,
    setQuality,
    toggleFullscreen,
    toggleMute,
    setPlaybackRate,
  };

  return {
    videoRef,
    playerState,
    controls,
    streamingData,
    isInitialized,
    session,
    
    // Utility functions
    formatTime: formatVideoTime,
    getProgress: () => calculateProgress(playerState.currentTime, playerState.duration),
    
    // Actions
    initialize: initializeStream,
  };
};


