"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Play,
  Plus,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  Info,
  Check,
} from "lucide-react";
import { Content } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ContentCardProps {
  content: Content;
  variant?: "small" | "medium" | "large";
  showProgress?: boolean;
  priority?: boolean;
  className?: string;
}

export function ContentCard({
  content,
  variant = "medium",
  showProgress = false,
  priority = false,
  className,
}: ContentCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(false);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatRating = (rating: number) => {
    return `${Math.round(rating * 10)}% Match`;
  };

  const cardDimensions = {
    small: "aspect-video", // 16:9
    medium: "aspect-video", // 16:9
    large: "aspect-video", // 16:9
  };

  const cardSizes = {
    small: "w-48",
    medium: "w-64",
    large: "w-80",
  };

  return (
    <div
      className={cn(
        "relative group cursor-pointer transition-all duration-300 ease-out",
        cardSizes[variant],
        isHovered ? "transform scale-110 z-50" : "transform scale-100 z-10",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Card */}
      <div
        className={cn(
          "relative overflow-hidden rounded-lg bg-gray-900 shadow-xl",
          cardDimensions[variant]
        )}
      >
        {/* Thumbnail Image */}
        <div className="relative w-full h-full">
          <Image
            src={content.thumbnail}
            alt={content.title}
            fill
            className={cn(
              "object-cover transition-all duration-500",
              imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
            )}
            sizes={
              variant === "large"
                ? "(max-width: 768px) 100vw, 320px"
                : variant === "medium"
                ? "(max-width: 768px) 80vw, 256px"
                : "(max-width: 768px) 60vw, 192px"
            }
            priority={priority}
            onLoad={() => setImageLoaded(true)}
          />

          {/* Loading State */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center">
              <div
                className="w-8 h-8 bg-gray-700 rounded animate-spin"
                style={{
                  clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                }}
              />
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

          {/* Content Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {content.isOriginal && (
              <Badge className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold">
                ONFLIX
              </Badge>
            )}
            {content.featured && (
              <Badge variant="secondary" className="text-xs bg-yellow-600">
                Featured
              </Badge>
            )}
            {content.trending && (
              <Badge variant="secondary" className="text-xs bg-orange-600">
                Trending
              </Badge>
            )}
          </div>

          {/* Quality Badge */}
          <div className="absolute top-2 right-2">
            <Badge
              variant="outline"
              className="text-xs bg-black/60 border-white/20 text-white"
            >
              {content.videos?.[0]?.quality || "HD"}
            </Badge>
          </div>

          {/* Progress Bar (if watching) */}
          {showProgress && (
            <div className="absolute bottom-0 left-0 right-0">
              <Progress value={65} className="h-1 bg-gray-700" />
            </div>
          )}

          {/* Quick Play Button (appears on hover) */}
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300",
              isHovered && "opacity-100"
            )}
          >
            <Button
              size="sm"
              className="bg-white/90 text-black hover:bg-white rounded-full w-12 h-12 p-0"
              asChild
            >
              <Link href={`/watch/${content.id}`}>
                <Play className="h-5 w-5 fill-current ml-0.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded Info Panel (shows on hover) */}
      {isHovered && (
        <div className="absolute top-full left-0 right-0 bg-gray-900 rounded-b-lg shadow-2xl border border-gray-700 p-4 animate-in slide-in-from-top-2 duration-200">
          {/* Action Buttons */}
          <div className="flex items-center gap-2 mb-3">
            <Button
              size="sm"
              className="bg-white text-black hover:bg-gray-200 rounded-full w-8 h-8 p-0"
              asChild
            >
              <Link href={`/watch/${content.id}`}>
                <Play className="h-4 w-4 fill-current" />
              </Link>
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="rounded-full w-8 h-8 p-0 border-gray-600 hover:border-white"
              onClick={() => setIsInWatchlist(!isInWatchlist)}
            >
              {isInWatchlist ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="rounded-full w-8 h-8 p-0 border-gray-600 hover:border-white"
            >
              <ThumbsUp className="h-3 w-3" />
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="rounded-full w-8 h-8 p-0 border-gray-600 hover:border-white"
            >
              <ThumbsDown className="h-3 w-3" />
            </Button>

            <div className="ml-auto">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full w-8 h-8 p-0 border-gray-600 hover:border-white"
                asChild
              >
                <Link href={`/content/${content.id}`}>
                  <ChevronDown className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Content Info */}
          <div className="space-y-2">
            {/* Title */}
            <h3 className="font-semibold text-white text-sm line-clamp-1">
              {content.title}
            </h3>

            {/* Metadata */}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {content.rating && (
                <span className="text-green-500 font-medium">
                  {formatRating(content.rating)}
                </span>
              )}
              <span>{new Date(content.releaseDate).getFullYear()}</span>
              <Badge
                variant="outline"
                className="text-xs px-1 py-0 border-gray-600"
              >
                {content.maturityRating || "PG-13"}
              </Badge>
              {content.duration && (
                <span>{formatDuration(content.duration)}</span>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-1">
              {content.genres.slice(0, 3).map((genre) => (
                <span key={genre.id} className="text-xs text-gray-400">
                  {genre.name}
                  {content.genres.indexOf(genre) <
                    Math.min(content.genres.length - 1, 2) && (
                    <span className="mx-1">•</span>
                  )}
                </span>
              ))}
            </div>

            {/* Description */}
            <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
              {content.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
