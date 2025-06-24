"use client";
import React, { useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  SkipBack,
  SkipForward,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useStreaming } from "@/hooks/use-streaming";
import { useStreamingContext } from "@/context/streaming-context";
import type { Content, VideoQuality, SubtitleTrack } from "@/types";
import { formatVideoTime } from "@/lib/utils/streaming";
import { cn } from "@/lib/utils/helpers";

interface VideoPlayerProps {
  content: Content;
  autoPlay?: boolean;
  onProgress?: (progress: number, duration: number) => void;
  onEnd?: () => void;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  content,
  autoPlay = false,
  onProgress,
  onEnd,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = React.useState(true);
  const [controlsTimeout, setControlsTimeout] =
    React.useState<NodeJS.Timeout>();

  const {
    preferredQuality,
    subtitlesEnabled,
    selectedSubtitleTrack,
    setSelectedSubtitleTrack,
  } = useStreamingContext();

  const {
    videoRef,
    playerState,
    controls,
    streamingData,
    isInitialized,
    formatTime,
    getProgress,
  } = useStreaming({
    contentId: content.id,
    quality: preferredQuality,
    autoPlay,
    onProgress,
    onError: (error) => console.error("Video player error:", error),
  });

  // Auto-hide controls
  const resetControlsTimeout = React.useCallback(() => {
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }

    setShowControls(true);
    const timeout = setTimeout(() => {
      if (playerState.isPlaying) {
        setShowControls(false);
      }
    }, 3000);

    setControlsTimeout(timeout);
  }, [controlsTimeout, playerState.isPlaying]);

  // Mouse movement and activity
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = () => resetControlsTimeout();
    const handleMouseLeave = () => {
      if (playerState.isPlaying) {
        setShowControls(false);
      }
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [resetControlsTimeout, playerState.isPlaying]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.code) {
        case "Space":
          e.preventDefault();
          playerState.isPlaying ? controls.pause() : controls.play();
          break;
        case "KeyF":
          e.preventDefault();
          controls.toggleFullscreen();
          break;
        case "KeyM":
          e.preventDefault();
          controls.toggleMute();
          break;
        case "ArrowLeft":
          e.preventDefault();
          controls.seek(Math.max(0, playerState.currentTime - 10));
          break;
        case "ArrowRight":
          e.preventDefault();
          controls.seek(
            Math.min(playerState.duration, playerState.currentTime + 10)
          );
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [controls, playerState]);

  const handleProgressChange = (value: number[]) => {
    const newTime = (value[0] / 100) * playerState.duration;
    controls.seek(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    controls.setVolume(value[0] / 100);
  };

  if (!isInitialized || !streamingData) {
    return (
      <div className="flex items-center justify-center bg-black aspect-video">
        <div className="text-center text-white">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative bg-black aspect-video group", className)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={streamingData.streaming_url}
        className="w-full h-full"
        poster={content.backdrop_url}
        onClick={() =>
          playerState.isPlaying ? controls.pause() : controls.play()
        }
      >
        {/* Subtitles */}
        {subtitlesEnabled && selectedSubtitleTrack && (
          <track
            kind="subtitles"
            src={selectedSubtitleTrack.src}
            srcLang={selectedSubtitleTrack.language}
            label={selectedSubtitleTrack.label}
            default={selectedSubtitleTrack.default}
          />
        )}
      </video>

      {/* Loading Overlay */}
      {(playerState.isLoading || playerState.isBuffering) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      )}

      {/* Error Overlay */}
      {playerState.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/75">
          <div className="text-center text-white">
            <p className="mb-2">Playback error occurred</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reload Player
            </Button>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            variant="ghost"
            size="lg"
            onClick={() =>
              playerState.isPlaying ? controls.pause() : controls.play()
            }
            className="bg-black/50 hover:bg-black/70 text-white border-white/20"
          >
            {playerState.isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8" />
            )}
          </Button>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          {/* Progress Bar */}
          <div className="space-y-1">
            <Slider
              value={[getProgress()]}
              onValueChange={handleProgressChange}
              max={100}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-white/80">
              <span>{formatTime(playerState.currentTime)}</span>
              <span>{formatTime(playerState.duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Play/Pause */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  playerState.isPlaying ? controls.pause() : controls.play()
                }
                className="text-white hover:bg-white/10"
              >
                {playerState.isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>

              {/* Skip Back */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  controls.seek(Math.max(0, playerState.currentTime - 10))
                }
                className="text-white hover:bg-white/10"
              >
                <SkipBack className="w-4 h-4" />
              </Button>

              {/* Skip Forward */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  controls.seek(
                    Math.min(playerState.duration, playerState.currentTime + 10)
                  )
                }
                className="text-white hover:bg-white/10"
              >
                <SkipForward className="w-4 h-4" />
              </Button>

              {/* Volume */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={controls.toggleMute}
                  className="text-white hover:bg-white/10"
                >
                  {playerState.isMuted || playerState.volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
                <div className="w-24">
                  <Slider
                    value={[playerState.volume * 100]}
                    onValueChange={handleVolumeChange}
                    max={100}
                    step={1}
                  />
                </div>
              </div>

              {/* Quality Badge */}
              <Badge variant="secondary" className="ml-4">
                {playerState.quality.toUpperCase()}
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              {/* Settings */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Quality</h4>
                      <select
                        value={playerState.quality}
                        onChange={(e) =>
                          controls.setQuality(e.target.value as VideoQuality)
                        }
                        className="w-full p-2 border rounded"
                      >
                        <option value="480p">480p</option>
                        <option value="720p">720p</option>
                        <option value="1080p">1080p</option>
                        <option value="4k">4K</option>
                      </select>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Playback Speed</h4>
                      <select
                        value={playerState.playbackRate}
                        onChange={(e) =>
                          controls.setPlaybackRate(parseFloat(e.target.value))
                        }
                        className="w-full p-2 border rounded"
                      >
                        <option value="0.5">0.5x</option>
                        <option value="0.75">0.75x</option>
                        <option value="1">Normal</option>
                        <option value="1.25">1.25x</option>
                        <option value="1.5">1.5x</option>
                        <option value="2">2x</option>
                      </select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="sm"
                onClick={controls.toggleFullscreen}
                className="text-white hover:bg-white/10"
              >
                {playerState.isFullscreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
