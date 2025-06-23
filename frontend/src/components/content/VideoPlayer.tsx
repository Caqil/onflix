import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Subtitles,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { contentService } from "../../services/content";
import { formatDuration, throttle } from "../../utils/helpers";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "../../utils/helpers";

interface VideoPlayerProps {
  contentId: string;
  episodeId?: string;
  title: string;
  autoPlay?: boolean;
  startTime?: number;
  onProgressUpdate?: (progress: number) => void;
  onEnded?: () => void;
  className?: string;
}

interface StreamData {
  streamUrl: string;
  subtitles: Array<{ language: string; url: string }>;
  qualities: string[];
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  contentId,
  episodeId,
  title,
  autoPlay = false,
  startTime = 0,
  onProgressUpdate,
  onEnded,
  className,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffering, setBuffering] = useState(false);

  // Settings
  const [selectedQuality, setSelectedQuality] = useState("auto");
  const [selectedSubtitle, setSelectedSubtitle] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Progress tracking
  const [watchedDuration, setWatchedDuration] = useState(0);
  const progressUpdateRef = useRef<NodeJS.Timeout>();

  // Fetch stream data
  useEffect(() => {
    fetchStreamData();
  }, [contentId, episodeId]);

  // Set initial time
  useEffect(() => {
    if (videoRef.current && startTime > 0) {
      videoRef.current.currentTime = startTime;
    }
  }, [startTime, streamData]);

  // Auto-hide controls
  useEffect(() => {
    if (showControls && isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isPlaying]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          skipBackward();
          break;
        case "ArrowRight":
          e.preventDefault();
          skipForward();
          break;
        case "ArrowUp":
          e.preventDefault();
          changeVolume(0.1);
          break;
        case "ArrowDown":
          e.preventDefault();
          changeVolume(-0.1);
          break;
        case "KeyM":
          e.preventDefault();
          toggleMute();
          break;
        case "KeyF":
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Progress update throttled function
  const throttledProgressUpdate = useCallback(
    throttle((progress: number) => {
      onProgressUpdate?.(progress);
    }, 5000),
    [onProgressUpdate]
  );

  const fetchStreamData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await contentService.getStreamUrl(
        contentId,
        episodeId,
        selectedQuality
      );
      setStreamData(data);

      // Set default quality if available
      if (data.qualities.length > 0 && selectedQuality === "auto") {
        setSelectedQuality(data.qualities[0]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load video");
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const skipBackward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(
      0,
      videoRef.current.currentTime - 10
    );
  };

  const skipForward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(
      duration,
      videoRef.current.currentTime + 10
    );
  };

  const changeVolume = (delta: number) => {
    if (!videoRef.current) return;
    const newVolume = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    videoRef.current.muted = newMuted;
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Failed to toggle fullscreen:", error);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !progressRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleQualityChange = async (quality: string) => {
    if (!videoRef.current) return;

    const currentTime = videoRef.current.currentTime;
    const wasPlaying = !videoRef.current.paused;

    setSelectedQuality(quality);
    setLoading(true);

    try {
      const data = await contentService.getStreamUrl(
        contentId,
        episodeId,
        quality
      );
      setStreamData(data);

      // Restore playback position
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = currentTime;
          if (wasPlaying) {
            videoRef.current.play();
          }
        }
        setLoading(false);
      }, 100);
    } catch (error) {
      setError("Failed to change quality");
      setLoading(false);
    }
  };

  const handleSubtitleChange = (language: string) => {
    setSelectedSubtitle(language);

    if (!videoRef.current) return;

    // Remove existing text tracks
    const tracks = videoRef.current.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = "disabled";
    }

    // Enable selected subtitle
    if (language) {
      for (let i = 0; i < tracks.length; i++) {
        if (tracks[i].language === language) {
          tracks[i].mode = "showing";
          break;
        }
      }
    }
  };

  // Video event handlers
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (autoPlay) {
        videoRef.current.play();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      setCurrentTime(current);

      // Update progress
      const progress = (current / duration) * 100;
      throttledProgressUpdate(progress);

      // Track watched duration
      setWatchedDuration((prev) => Math.max(prev, current));
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setShowControls(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
    setShowControls(true);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setShowControls(true);
    onEnded?.();
  };

  const handleWaiting = () => {
    setBuffering(true);
  };

  const handleCanPlay = () => {
    setBuffering(false);
  };

  const handleVolumeChange = () => {
    if (videoRef.current) {
      setVolume(videoRef.current.volume);
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };

  // Register fullscreen event listener
  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const showControlsHandler = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  if (loading) {
    return (
      <div
        className={cn(
          "relative bg-black aspect-video flex items-center justify-center",
          className
        )}
      >
        <div className="text-center text-white">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !streamData) {
    return (
      <div
        className={cn(
          "relative bg-black aspect-video flex items-center justify-center",
          className
        )}
      >
        <div className="text-center text-white">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <p className="mb-4">{error || "Failed to load video"}</p>
          <Button onClick={fetchStreamData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative bg-black group", className)}
      onMouseMove={showControlsHandler}
      onMouseEnter={showControlsHandler}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        src={streamData.streamUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
        onVolumeChange={handleVolumeChange}
        playsInline
        preload="metadata"
      >
        {/* Subtitle tracks */}
        {streamData.subtitles.map((subtitle) => (
          <track
            key={subtitle.language}
            kind="subtitles"
            src={subtitle.url}
            srcLang={subtitle.language}
            label={subtitle.language}
          />
        ))}
      </video>

      {/* Buffering Spinner */}
      {buffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
        </div>
      )}

      {/* Controls Overlay */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Center Play Button */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              onClick={togglePlay}
              size="lg"
              className="bg-white/20 hover:bg-white/30 text-white rounded-full w-20 h-20"
            >
              <Play className="h-8 w-8 fill-current ml-1" />
            </Button>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Progress Bar */}
          <div
            ref={progressRef}
            className="w-full h-1 bg-white/30 rounded-full cursor-pointer mb-4"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-red-600 rounded-full relative"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          <div className="flex items-center justify-between text-white">
            {/* Left Controls */}
            <div className="flex items-center gap-4">
              <Button
                onClick={togglePlay}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>

              <Button
                onClick={skipBackward}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>

              <Button
                onClick={skipForward}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <RotateCw className="h-5 w-5" />
              </Button>

              <Button
                onClick={toggleMute}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {formatDuration(Math.floor(currentTime))}
                </span>
                <span className="text-white/60">/</span>
                <span className="text-sm">
                  {formatDuration(Math.floor(duration))}
                </span>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              {/* Settings Menu */}
              <div className="relative">
                <Button
                  onClick={() => setShowSettings(!showSettings)}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <Settings className="h-5 w-5" />
                </Button>

                {showSettings && (
                  <Card className="absolute bottom-full right-0 mb-2 w-64 bg-black/90 border-white/20">
                    <CardContent className="p-4 space-y-4">
                      <div>
                        <label className="text-sm font-medium text-white mb-2 block">
                          Quality
                        </label>
                        <Select
                          value={selectedQuality}
                          onValueChange={handleQualityChange}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto</SelectItem>
                            {streamData.qualities.map((quality) => (
                              <SelectItem key={quality} value={quality}>
                                {quality}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-white mb-2 block">
                          Subtitles
                        </label>
                        <Select
                          value={selectedSubtitle}
                          onValueChange={handleSubtitleChange}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {streamData.subtitles.map((subtitle) => (
                              <SelectItem
                                key={subtitle.language}
                                value={subtitle.language}
                              >
                                {subtitle.language.toUpperCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-white mb-2 block">
                          Playback Speed
                        </label>
                        <Select
                          value={playbackRate.toString()}
                          onValueChange={(value) => {
                            const rate = parseFloat(value);
                            setPlaybackRate(rate);
                            if (videoRef.current) {
                              videoRef.current.playbackRate = rate;
                            }
                          }}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0.25">0.25x</SelectItem>
                            <SelectItem value="0.5">0.5x</SelectItem>
                            <SelectItem value="0.75">0.75x</SelectItem>
                            <SelectItem value="1">Normal</SelectItem>
                            <SelectItem value="1.25">1.25x</SelectItem>
                            <SelectItem value="1.5">1.5x</SelectItem>
                            <SelectItem value="2">2x</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Fullscreen Button */}
              <Button
                onClick={toggleFullscreen}
                variant="ghost"
                size="sm"
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

      {/* Title Overlay */}
      <div
        className={cn(
          "absolute top-4 left-4 text-white transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
    </div>
  );
};

export default VideoPlayer;
