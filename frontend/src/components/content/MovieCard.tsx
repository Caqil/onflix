import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play,
  Plus,
  Check,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  Star,
  Clock,
  Calendar,
  Info,
  Volume2,
  VolumeX,
} from "lucide-react";
import { ContentItem } from "../../services/content";
import { useWatchlist } from "../../hooks/useContent";
import { formatDuration, formatDate, truncateText } from "../../utils/helpers";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { cn } from "../../utils/helpers";

interface MovieCardProps {
  content: ContentItem;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
  autoPlayTrailer?: boolean;
  layout?: "portrait" | "landscape";
  className?: string;
}

const MovieCard: React.FC<MovieCardProps> = ({
  content,
  size = "md",
  showDetails = false,
  autoPlayTrailer = false,
  layout = "portrait",
  className,
}) => {
  const navigate = useNavigate();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();

  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [loading, setLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();

  const sizeClasses = {
    sm: layout === "portrait" ? "w-32 h-48" : "w-48 h-32",
    md: layout === "portrait" ? "w-40 h-60" : "w-60 h-40",
    lg: layout === "portrait" ? "w-48 h-72" : "w-72 h-48",
  };

  const aspectRatio = layout === "portrait" ? "aspect-[2/3]" : "aspect-[16/9]";

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);

    // Auto-play trailer after hover delay
    if (autoPlayTrailer && content.trailer) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsPlaying(true);
        if (videoRef.current) {
          videoRef.current.play();
        }
      }, 1000);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsExpanded(false);
    setIsPlaying(false);

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/watch/${content.id}`);
  };

  const handleWatchlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setLoading(true);
      if (isInWatchlist(content.id)) {
        await removeFromWatchlist(content.id);
      } else {
        await addToWatchlist(content.id);
      }
    } catch (error) {
      console.error("Failed to toggle watchlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = () => {
    if (!isExpanded) {
      navigate(`/browse/${content.id}`);
    }
  };

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const renderPlayButton = () => (
    <Button
      onClick={handlePlay}
      size="sm"
      className="bg-white text-black hover:bg-white/90 rounded-full w-8 h-8 p-0"
    >
      <Play className="h-4 w-4 fill-current" />
    </Button>
  );

  const renderWatchlistButton = () => (
    <Button
      onClick={handleWatchlistToggle}
      disabled={loading}
      variant="outline"
      size="sm"
      className="bg-black/50 border-white/50 text-white hover:bg-white/10 rounded-full w-8 h-8 p-0"
    >
      {isInWatchlist(content.id) ? (
        <Check className="h-4 w-4" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
    </Button>
  );

  const renderExpandButton = () => (
    <Button
      onClick={handleExpand}
      variant="outline"
      size="sm"
      className="bg-black/50 border-white/50 text-white hover:bg-white/10 rounded-full w-8 h-8 p-0"
    >
      <ChevronDown
        className={cn(
          "h-4 w-4 transition-transform",
          isExpanded && "rotate-180"
        )}
      />
    </Button>
  );

  return (
    <div
      className={cn(
        "group relative cursor-pointer transition-all duration-300",
        isHovered && "z-10 scale-105",
        isExpanded && "z-20",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
    >
      <Card
        className={cn(
          "overflow-hidden border-0 bg-transparent",
          isExpanded && "shadow-2xl"
        )}
      >
        {/* Main Image/Video Container */}
        <div
          className={cn(
            "relative overflow-hidden rounded-lg",
            sizeClasses[size],
            aspectRatio
          )}
        >
          {/* Background Image */}
          <img
            src={layout === "portrait" ? content.poster : content.backdrop}
            alt={content.title}
            className={cn(
              "w-full h-full object-cover transition-all duration-300",
              isPlaying && "opacity-0"
            )}
          />

          {/* Trailer Video */}
          {content.trailer && (
            <video
              ref={videoRef}
              className={cn(
                "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
                isPlaying ? "opacity-100" : "opacity-0"
              )}
              muted={isMuted}
              loop
              playsInline
            >
              <source src={content.trailer} type="video/mp4" />
            </video>
          )}

          {/* Gradient Overlay */}
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300",
              isHovered ? "opacity-100" : "opacity-0"
            )}
          />

          {/* Progress Bar */}
          {content.watchProgress && content.watchProgress.progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0">
              <div className="bg-white/20 h-1">
                <div
                  className="bg-red-600 h-full"
                  style={{ width: `${content.watchProgress.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Status Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {content.featured && (
              <Badge className="bg-red-600 text-white text-xs">Featured</Badge>
            )}
            {content.trending && (
              <Badge className="bg-orange-600 text-white text-xs">
                Trending
              </Badge>
            )}
          </div>

          {/* Hover Controls */}
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
              isHovered ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="flex items-center gap-2">
              {renderPlayButton()}
              {renderWatchlistButton()}
              {showDetails && renderExpandButton()}
              {isPlaying && content.trailer && (
                <Button
                  onClick={toggleMute}
                  variant="outline"
                  size="sm"
                  className="bg-black/50 border-white/50 text-white hover:bg-white/10 rounded-full w-8 h-8 p-0"
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Rating */}
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 px-2 py-1 rounded text-white text-xs">
            <Star className="h-3 w-3 text-yellow-400" />
            <span>{content.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Content Details */}
        <CardContent className="p-3">
          <h3 className="font-medium text-sm mb-1 truncate">{content.title}</h3>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <span>{formatDate(content.releaseDate).split(",")[1]}</span>
            <span>•</span>
            <span>{formatDuration(content.duration)}</span>
            <span>•</span>
            <Badge variant="outline" className="text-xs px-1 py-0">
              {content.type.replace("_", " ")}
            </Badge>
          </div>

          {showDetails && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {truncateText(content.description, 100)}
            </p>
          )}
        </CardContent>

        {/* Expanded Details */}
        {isExpanded && showDetails && (
          <div className="absolute top-full left-0 right-0 bg-card border rounded-b-lg shadow-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium">
                  {content.rating.toFixed(1)}
                </span>
              </div>
              <span className="text-muted-foreground">•</span>
              <span className="text-sm">
                {new Date(content.releaseDate).getFullYear()}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-sm">
                {formatDuration(content.duration)}
              </span>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-3">
              {content.description}
            </p>

            <div className="flex flex-wrap gap-1">
              {content.genre.slice(0, 3).map((genre) => (
                <Badge key={genre} variant="secondary" className="text-xs">
                  {genre}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t">
              <Button onClick={handlePlay} size="sm" className="flex-1">
                <Play className="h-3 w-3 mr-1" />
                Play
              </Button>
              <Button
                onClick={handleWatchlistToggle}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {isInWatchlist(content.id) ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/browse/${content.id}`);
                }}
                variant="outline"
                size="sm"
              >
                <Info className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default MovieCard;
