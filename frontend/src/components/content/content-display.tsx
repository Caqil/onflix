"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Play,
  Plus,
  Star,
  Clock,
  Calendar,
  Heart,
  Info,
  Download,
  Share,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils/helpers";
import type { Content } from "@/types";

interface ContentCardProps {
  content: Content;
  viewMode?: "grid" | "list";
  showDetails?: boolean;
  className?: string;
}

export const ContentCard: React.FC<ContentCardProps> = ({
  content,
  viewMode = "grid",
  showDetails = true,
  className,
}) => {
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleWatchlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsInWatchlist(!isInWatchlist);
    // TODO: Call API to add/remove from watchlist
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: Implement share functionality
    navigator.share?.({
      title: content.title,
      text: content.description,
      url: `/content/${content.id}`,
    });
  };

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatRating = (rating: number) => {
    return rating.toFixed(1);
  };

  if (viewMode === "list") {
    return (
      <Card
        className={cn(
          "group cursor-pointer hover:shadow-lg transition-all duration-200",
          className
        )}
      >
        <Link href={`/content/${content.id}`}>
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* Poster */}
              <div className="relative w-24 aspect-[2/3] rounded-lg overflow-hidden flex-shrink-0">
                {!imageError ? (
                  <img
                    src={content.poster_url}
                    alt={content.title}
                    className={cn(
                      "w-full h-full object-cover transition-opacity duration-200",
                      imageLoaded ? "opacity-100" : "opacity-0"
                    )}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Play className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}

                {!imageLoaded && !imageError && (
                  <div className="absolute inset-0 bg-muted animate-pulse" />
                )}
              </div>

              {/* Content Info */}
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-1">
                      {content.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {content.type === "movie" ? "Movie" : "TV Show"}
                      </Badge>

                      {content.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{formatRating(content.rating)}</span>
                        </div>
                      )}

                      {content.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDuration(content.duration)}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(content.release_date).getFullYear()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleWatchlistToggle}
                          >
                            {isInWatchlist ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isInWatchlist
                            ? "Remove from Watchlist"
                            : "Add to Watchlist"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleShare}
                          >
                            <Share className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Share</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                {showDetails && (
                  <>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {content.description}
                    </p>

                    <div className="flex flex-wrap gap-1">
                      {content.genres.slice(0, 3).map((genre) => (
                        <Badge
                          key={genre}
                          variant="secondary"
                          className="text-xs"
                        >
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    );
  }

  // Grid view
  return (
    <Card
      className={cn(
        "group cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden",
        className
      )}
    >
      <Link href={`/content/${content.id}`}>
        <div className="relative aspect-[2/3] overflow-hidden">
          {/* Poster Image */}
          {!imageError ? (
            <img
              src={content.poster_url}
              alt={content.title}
              className={cn(
                "w-full h-full object-cover transition-all duration-300 group-hover:scale-105",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Play className="w-12 h-12 text-muted-foreground" />
            </div>
          )}

          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Button size="lg" className="rounded-full">
                <Play className="w-5 h-5 mr-2" />
                Play
              </Button>

              <div className="flex items-center gap-2 justify-center">
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full"
                  onClick={handleWatchlistToggle}
                >
                  {isInWatchlist ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full"
                  onClick={handleShare}
                >
                  <Share className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content Type Badge */}
          <Badge className="absolute top-2 left-2">
            {content.type === "movie" ? "Movie" : "TV"}
          </Badge>

          {/* Rating */}
          {content.rating && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 text-white px-2 py-1 rounded text-xs">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{formatRating(content.rating)}</span>
            </div>
          )}
        </div>

        {/* Content Info */}
        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold line-clamp-2 min-h-[2.5rem]">
            {content.title}
          </h3>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{new Date(content.release_date).getFullYear()}</span>
            {content.duration && (
              <>
                <span>•</span>
                <span>{formatDuration(content.duration)}</span>
              </>
            )}
          </div>

          {showDetails && (
            <>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {content.description}
              </p>

              <div className="flex flex-wrap gap-1">
                {content.genres.slice(0, 2).map((genre) => (
                  <Badge key={genre} variant="secondary" className="text-xs">
                    {genre}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Link>
    </Card>
  );
};

interface ContentGridProps {
  content: Content[];
  viewMode?: "grid" | "list";
  showDetails?: boolean;
  className?: string;
}

export const ContentGrid: React.FC<ContentGridProps> = ({
  content,
  viewMode = "grid",
  showDetails = true,
  className,
}) => {
  if (content.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Play className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No content available</h3>
        <p className="text-muted-foreground">
          Check back later for new content or try a different search.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        viewMode === "grid"
          ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4"
          : "space-y-4",
        className
      )}
    >
      {content.map((item) => (
        <ContentCard
          key={item.id}
          content={item}
          viewMode={viewMode}
          showDetails={showDetails}
        />
      ))}
    </div>
  );
};
