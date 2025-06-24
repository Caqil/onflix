import { useEffect, useRef, useState } from 'react';
import { useContent } from './useContent';

interface UseVideoOptions {
  contentId: string;
  autoplay?: boolean;
  quality?: string;
  onProgress?: (progress: number, duration: number) => void;
  onEnded?: () => void;
  onError?: (error: Error) => void;
}

export function useVideo({
  contentId,
  autoplay = false,
  quality = 'auto',
  onProgress,
  onEnded,
  onError
}: UseVideoOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { startStream, loadSubtitles, availableSubtitles, updateWatchProgress } = useContent();

  // Initialize video stream
  useEffect(() => {
    const initializeVideo = async () => {
      if (!contentId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const streamUrl = await startStream(contentId, quality as any);
        
        if (videoRef.current) {
          videoRef.current.src = streamUrl;
          if (autoplay) {
            await videoRef.current.play();
            setIsPlaying(true);
          }
        }
        
        // Load subtitles
        await loadSubtitles(contentId);
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to load video';
        setError(errorMessage);
        onError?.(new Error(errorMessage));
      } finally {
        setIsLoading(false);
      }
    };

    initializeVideo();
  }, [contentId, quality]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      const current = video.currentTime;
      setCurrentTime(current);
      
      // Update progress every 10 seconds
      if (Math.floor(current) % 10 === 0) {
        onProgress?.(current, video.duration);
        updateWatchProgress(contentId, current, video.duration);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
      // Mark as completed
      updateWatchProgress(contentId, video.duration, video.duration);
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    const handleError = () => {
      const errorMessage = 'Video playback error';
      setError(errorMessage);
      onError?.(new Error(errorMessage));
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('error', handleError);
    };
  }, [contentId, onProgress, onEnded, onError]);

  // Video controls
  const play = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('Failed to play video:', err);
      }
    }
  };

  const pause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const seek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const changeVolume = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = Math.max(0, Math.min(1, newVolume));
      setVolume(newVolume);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const skipForward = (seconds: number = 10) => {
    seek(Math.min(currentTime + seconds, duration));
  };

  const skipBackward = (seconds: number = 10) => {
    seek(Math.max(currentTime - seconds, 0));
  };

  return {
    // Refs
    videoRef,
    
    // State
    isLoading,
    isPlaying,
    duration,
    currentTime,
    volume,
    isMuted,
    error,
    availableSubtitles,
    
    // Progress helpers
    progress: duration > 0 ? (currentTime / duration) * 100 : 0,
    remainingTime: duration - currentTime,
    
    // Controls
    play,
    pause,
    seek,
    changeVolume,
    toggleMute,
    togglePlayPause,
    skipForward,
    skipBackward,
  };
}


