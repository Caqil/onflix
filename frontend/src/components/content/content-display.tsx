"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Play, Plus, Check, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuthContext } from "@/context/auth-context";
import { useAppContext } from "@/context/app-context";
import userAPI from "@/lib/api/user";
import type { Content, WatchlistItem } from "@/types";
import {
  formatDate,
  formatDuration,
  getGenreDisplayName,
  getImageUrl,
  truncateText,
} from "@/lib/utils/helpers";
import { cn } from "@/lib/utils/helpers";

interface ContentCardProps {
  content: Content;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
  isInWatchlist?: boolean;
  onWatchlistChange?: () => void;
  className?: string;
}

export const ContentCard: React.FC<ContentCardProps> = ({
  content,
  size = "md",
  showDetails = true,
  isInWatchlist = false,
  onWatchlistChange,
  className,
}) => {
  const { isAuthenticated, canStream } = useAuthContext();
  const { addNotification } = useAppContext();
  const { toast } = useToast();
  const [isAddingToWatchlist, setIsAddingToWatchlist] = React.useState(false);

  const sizeClasses = {
    sm: "w-32 h-48",
    md: "w-48 h-72",
    lg: "w-64 h-96",
  };

  const handleWatchlistToggle = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add content to your watchlist.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingToWatchlist(true);
    try {
      if (isInWatchlist) {
        await userAPI.removeFromWatchlist(content.id);
        addNotification({
          type: "success",
          title: "Removed from Watchlist",
          message: `"${content.title}" has been removed from your watchlist.`,
        });
      } else {
        await userAPI.addToWatchlist(content.id);
        addNotification({
          type: "success",
          title: "Added to Watchlist",
          message: `"${content.title}" has been added to your watchlist.`,
        });
      }
      onWatchlistChange?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update watchlist",
        variant: "destructive",
      });
    } finally {
      setIsAddingToWatchlist(false);
    }
  };

  const handlePlay = () => {
    if (!canStream()) {
      toast({
        title: "Subscription Required",
        description: "Please upgrade to a premium plan to start streaming.",
        variant: "destructive",
      });
      return;
    }
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all hover:scale-105",
        className
      )}
    >
      <div className={cn("relative", sizeClasses[size])}>
        <Image
          src={getImageUrl(content.poster_url, "400")}
          alt={content.title}
          fill
          className="object-cover transition-transform group-hover:scale-110"
          sizes="(max-width: 768px) 160px, (max-width: 1024px) 200px, 256px"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-2">
              <Button size="sm" onClick={handlePlay} asChild>
                <Link href={`/watch/${content.id}`}>
                  <Play className="w-4 h-4 mr-1" />
                  Play
                </Link>
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={handleWatchlistToggle}
                disabled={isAddingToWatchlist}
              >
                {isInWatchlist ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Rating Badge */}
        {content.rating > 0 && (
          <Badge className="absolute top-2 right-2 bg-black/60">
            <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
            {content.rating.toFixed(1)}
          </Badge>
        )}

        {/* Duration/Episodes Badge */}
        {content.duration && (
          <Badge variant="secondary" className="absolute top-2 left-2">
            <Clock className="w-3 h-3 mr-1" />
            {formatDuration(content.duration)}
          </Badge>
        )}
      </div>

      {showDetails && (
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-1 line-clamp-2">
            <Link
              href={`/content/${content.id}`}
              className="hover:text-primary"
            >
              {content.title}
            </Link>
          </h3>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <span className="capitalize">{content.type.replace("_", " ")}</span>
            <span>•</span>
            <span className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(content.release_date).getFullYear()}
            </span>
          </div>

          <div className="flex flex-wrap gap-1 mb-2">
            {content.genres.slice(0, 2).map((genre) => (
              <Badge key={genre} variant="outline" className="text-xs">
                {getGenreDisplayName(genre)}
              </Badge>
            ))}
          </div>

          {content.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {truncateText(content.description, 80)}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
};

interface ContentGridProps {
  content: Content[];
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  watchlistItems?: WatchlistItem[];
  onWatchlistChange?: () => void;
  className?: string;
}

export const ContentGrid: React.FC<ContentGridProps> = ({
  content,
  isLoading = false,
  error = null,
  emptyMessage = "No content found",
  watchlistItems = [],
  onWatchlistChange,
  className,
}) => {
  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={cn(
          "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4",
          className
        )}
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="w-full h-72 bg-muted animate-pulse rounded-lg" />
            <div className="space-y-2">
              <div className="h-4 bg-muted animate-pulse rounded" />
              <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4",
        className
      )}
    >
      {content.map((item) => (
        <ContentCard
          key={item.id}
          content={item}
          isInWatchlist={watchlistItems.some((w) => w.id === item.id)}
          onWatchlistChange={onWatchlistChange}
        />
      ))}
    </div>
  );
};
