"use client";

import { useState, useRef, useEffect } from "react";
import ReactPlayer from "react-player";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Settings,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { contentAPI, userAPI } from "@/lib/api";

interface VideoPlayerProps {
  contentId: string;
  title: string;
  streamingUrl?: string;
  autoPlay?: boolean;
  onClose?: () => void;
}

export function VideoPlayer({
  contentId,
  title,
  streamingUrl,
  autoPlay = false,
  onClose,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [played, setPlayed] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [actualStreamingUrl, setActualStreamingUrl] = useState(streamingUrl);

  const playerRef = useRef<ReactPlayer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    if (!streamingUrl) {
      fetchStreamingUrl();
    }
  }, [contentId, streamingUrl]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.code) {
        case "Space":
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;
        case "ArrowLeft":
          seekTo(Math.max(0, played - 0.1));
          break;
        case "ArrowRight":
          seekTo(Math.min(1, played + 0.1));
          break;
        case "KeyM":
          setIsMuted(!isMuted);
          break;
        case "KeyF":
          toggleFullscreen();
          break;
        case "Escape":
          if (isFullscreen) {
            exitFullscreen();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [isPlaying, isMuted, played, isFullscreen]);

  const fetchStreamingUrl = async () => {
    try {
      const response = await contentAPI.stream(contentId);
      setActualStreamingUrl(response.data.data?.streaming_url);
    } catch (error) {
      console.error("Failed to get streaming URL:", error);
    }
  };

  const handleProgress = (progress: { played: number; loaded: number }) => {
    setPlayed(progress.played);
    setLoaded(progress.loaded);

    // Update watch progress every 30 seconds
    if (Math.floor(progress.played * duration) % 30 === 0) {
      updateWatchProgress(progress.played * duration);
    }
  };

  const updateWatchProgress = async (currentTime: number) => {
    try {
      // Use the current user's profile ID - you may need to get this from context, props, or session
      const profileId = localStorage.getItem('profileId') || ''; // Replace with actual way to get profile ID
      await userAPI.updateWatchProgress({ 
        content_id: contentId, 
        profile_id: profileId,
        progress: currentTime, 
        duration 
      });
    } catch (error) {
      console.error("Failed to update watch progress:", error);
    }
  };

  const seekTo = (fraction: number) => {
    playerRef.current?.seekTo(fraction);
    setPlayed(fraction);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      exitFullscreen();
    }
  };

  const exitFullscreen = () => {
    document.exitFullscreen();
    setIsFullscreen(false);
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  if (!actualStreamingUrl) {
    return (
      <div className="flex items-center justify-center h-64 bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-black group",
        isFullscreen ? "h-screen w-screen" : "w-full aspect-video"
      )}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Close button */}
      {onClose && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>
      )}

      {/* Video Player */}
      <ReactPlayer
        ref={playerRef}
        url={actualStreamingUrl}
        width="100%"
        height="100%"
        playing={isPlaying}
        muted={isMuted}
        volume={volume}
        playbackRate={playbackRate}
        onProgress={handleProgress}
        onDuration={setDuration}
        onBuffer={() => setIsBuffering(true)}
        onBufferEnd={() => setIsBuffering(false)}
        onEnded={() => setIsPlaying(false)}
        config={{
          file: {
            attributes: {
              crossOrigin: "anonymous",
              preload: "metadata",
            },
          },
        }}
      />

      {/* Buffering Indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
        </div>
      )}

      {/* Controls */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Progress Bar */}
        <div className="mb-4">
          <Slider
            value={[played]}
            onValueChange={(value) => seekTo(value[0])}
            max={1}
            step={0.001}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-white/70 mt-1">
            <span>{formatTime(played * duration)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </Button>

            {/* Skip Buttons */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => seekTo(Math.max(0, played - 10 / duration))}
              className="text-white hover:bg-white/20"
            >
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => seekTo(Math.min(1, played + 10 / duration))}
              className="text-white hover:bg-white/20"
            >
              <SkipForward className="h-5 w-5" />
            </Button>

            {/* Volume */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
                className="text-white hover:bg-white/20"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              <div className="w-20">
                <Slider
                  value={[volume]}
                  onValueChange={(value) => setVolume(value[0])}
                  max={1}
                  step={0.1}
                />
              </div>
            </div>

            {/* Title */}
            <span className="text-white font-medium ml-4">{title}</span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Settings */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="text-white hover:bg-white/20"
              >
                <Settings className="h-5 w-5" />
              </Button>

              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-md p-2 min-w-[120px]">
                  <div className="text-white text-sm">
                    <div className="mb-2 font-medium">Playback Speed</div>
                    {playbackRates.map((rate) => (
                      <button
                        key={rate}
                        onClick={() => {
                          setPlaybackRate(rate);
                          setShowSettings(false);
                        }}
                        className={cn(
                          "block w-full text-left px-2 py-1 rounded hover:bg-white/20",
                          playbackRate === rate && "bg-white/20"
                        )}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
