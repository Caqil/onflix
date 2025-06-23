import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Plus, Info, Volume2, VolumeX, Star } from "lucide-react";
import { ContentItem } from "../../services/content";
import { useWatchlist } from "../../hooks/useContent";
import { formatDuration, truncateText } from "../../utils/helpers";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "../../utils/helpers";

interface HeroProps {
  content: ContentItem;
  autoPlay?: boolean;
  showTrailer?: boolean;
}

const Hero: React.FC<HeroProps> = ({
  content,
  autoPlay = false,
  showTrailer = true,
}) => {
  const navigate = useNavigate();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();

  const [isTrailerPlaying, setIsTrailerPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-play trailer on mount if enabled
  useEffect(() => {
    if (autoPlay && showTrailer && content.trailer) {
      const timer = setTimeout(() => {
        setIsTrailerPlaying(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, showTrailer, content.trailer]);

  const handlePlay = () => {
    navigate(`/watch/${content.id}`);
  };

  const handleWatchlistToggle = async () => {
    try {
      setIsLoading(true);
      if (isInWatchlist(content.id)) {
        await removeFromWatchlist(content.id);
      } else {
        await addToWatchlist(content.id);
      }
    } catch (error) {
      console.error("Failed to toggle watchlist:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoreInfo = () => {
    navigate(`/browse/${content.id}`);
  };

  const toggleTrailer = () => {
    setIsTrailerPlaying(!isTrailerPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background Image/Video */}
      <div className="absolute inset-0">
        {isTrailerPlaying && content.trailer ? (
          <video
            className="w-full h-full object-cover"
            autoPlay
            muted={isMuted}
            loop
            playsInline
          >
            <source src={content.trailer} type="video/mp4" />
          </video>
        ) : (
          <img
            src={content.backdrop}
            alt={content.title}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex items-center h-full">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-2xl">
            {/* Badges */}
            <div className="flex items-center gap-2 mb-4">
              {content.featured && (
                <Badge className="bg-red-600 text-white hover:bg-red-700">
                  Featured
                </Badge>
              )}
              {content.trending && (
                <Badge className="bg-orange-600 text-white hover:bg-orange-700">
                  Trending
                </Badge>
              )}
              <Badge variant="outline" className="text-white border-white/50">
                {content.type.replace("_", " ").toUpperCase()}
              </Badge>
            </div>

            {/* Title */}
            <h1 className="text-hero text-white font-bold mb-4 drop-shadow-lg">
              {content.title}
            </h1>

            {/* Metadata */}
            <div className="flex items-center gap-4 mb-6 text-white/90">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400" />
                <span className="font-medium">{content.rating.toFixed(1)}</span>
              </div>
              <span>{new Date(content.releaseDate).getFullYear()}</span>
              <span>{formatDuration(content.duration)}</span>
              <div className="flex gap-1">
                {content.genre.slice(0, 3).map((genre) => (
                  <Badge key={genre} variant="secondary" className="text-xs">
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Description */}
            <p className="text-subtitle text-white/90 mb-8 leading-relaxed">
              {truncateText(content.description, 300)}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 mb-8">
              <Button
                onClick={handlePlay}
                size="lg"
                className="bg-white text-black hover:bg-white/90 font-semibold px-8"
              >
                <Play className="h-5 w-5 mr-2 fill-current" />
                Play
              </Button>

              <Button
                onClick={handleWatchlistToggle}
                disabled={isLoading}
                variant="outline"
                size="lg"
                className="border-white/50 text-white hover:bg-white/10 px-8"
              >
                <Plus className="h-5 w-5 mr-2" />
                {isInWatchlist(content.id) ? "Remove from List" : "My List"}
              </Button>

              <Button
                onClick={handleMoreInfo}
                variant="outline"
                size="lg"
                className="border-white/50 text-white hover:bg-white/10 px-8"
              >
                <Info className="h-5 w-5 mr-2" />
                More Info
              </Button>
            </div>

            {/* Additional Info */}
            <div className="space-y-2 text-sm text-white/70">
              <div>
                <span className="font-medium">Director: </span>
                <span>{content.director.join(", ")}</span>
              </div>
              <div>
                <span className="font-medium">Starring: </span>
                <span>
                  {content.cast
                    .slice(0, 4)
                    .map((actor) => actor.name)
                    .join(", ")}
                  {content.cast.length > 4 && "..."}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Controls */}
      {showTrailer && content.trailer && (
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
          {isTrailerPlaying && (
            <Button
              onClick={toggleMute}
              variant="outline"
              size="sm"
              className="border-white/50 text-white hover:bg-white/10"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          )}

          <Button
            onClick={toggleTrailer}
            variant="outline"
            size="sm"
            className="border-white/50 text-white hover:bg-white/10"
          >
            {isTrailerPlaying ? "Show Image" : "Play Trailer"}
          </Button>
        </div>
      )}

      {/* Progress Bar (if continuing to watch) */}
      {content.watchProgress && content.watchProgress.progress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="bg-white/20 h-1">
            <div
              className="bg-red-600 h-full transition-all duration-300"
              style={{ width: `${content.watchProgress.progress}%` }}
            />
          </div>
          <div className="bg-black/50 px-4 py-2">
            <p className="text-white text-sm">
              Continue watching • {Math.round(content.watchProgress.progress)}%
              complete
            </p>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-30">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hero;
