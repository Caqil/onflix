"use client";

import { useState } from "react";
import { useContent } from "@/hooks/useContent";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { Content } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";

interface ContentCardProps {
  content: Content;
  profileId?: string;
}

export default function ContentCard({ content, profileId }: ContentCardProps) {
  const { isAuthenticated } = useAuth();
  const { canStreamContent } = useSubscription();
  const { toggleWatchlist, likeContent, unlikeContent, isLoading } =
    useContent();

  const [isHovered, setIsHovered] = useState(false);

  const handleWatchlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated || !profileId) return;

    try {
      await toggleWatchlist(content.id, profileId);
    } catch (error) {
      console.error("Failed to toggle watchlist:", error);
    }
  };

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) return;

    try {
      if (content.is_liked) {
        await unlikeContent(content.id);
      } else {
        await likeContent(content.id);
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatReleaseYear = (dateString: string) => {
    return new Date(dateString).getFullYear();
  };

  return (
    <div
      className="relative group cursor-pointer transition-transform duration-200 hover:scale-105"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/watch/${content.id}`}>
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden">
          {content.poster_url ? (
            <Image
              src={content.poster_url}
              alt={content.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}

          {/* Progress bar for watched content */}
          {content.watch_progress && content.watch_progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
              <div
                className="h-full bg-red-600"
                style={{
                  width: `${
                    (content.watch_progress / content.runtime_minutes) * 100
                  }%`,
                }}
              />
            </div>
          )}

          {/* Hover overlay */}
          {isHovered && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
              <div className="text-white text-center p-4">
                <h3 className="font-bold text-lg mb-2">{content.title}</h3>
                <p className="text-sm mb-3 line-clamp-3">
                  {content.description}
                </p>

                <div className="flex items-center justify-center space-x-2 text-xs mb-3">
                  <span>{formatReleaseYear(content.release_date)}</span>
                  <span>•</span>
                  <span>{formatDuration(content.runtime_minutes)}</span>
                  <span>•</span>
                  <span className="px-2 py-1 bg-gray-800 rounded text-xs">
                    {content.maturity_rating}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-center space-x-2">
                  {canStreamContent && (
                    <button className="bg-white text-black px-4 py-2 rounded text-sm font-medium hover:bg-gray-200">
                      Play
                    </button>
                  )}

                  {isAuthenticated && profileId && (
                    <>
                      <button
                        onClick={handleWatchlistToggle}
                        disabled={isLoading}
                        className="p-2 border border-white rounded-full hover:bg-white hover:text-black transition-colors"
                        title={
                          content.is_in_watchlist
                            ? "Remove from Watchlist"
                            : "Add to Watchlist"
                        }
                      >
                        {content.is_in_watchlist ? "✓" : "+"}
                      </button>

                      <button
                        onClick={handleLikeToggle}
                        disabled={isLoading}
                        className={`p-2 border border-white rounded-full hover:bg-white hover:text-black transition-colors ${
                          content.is_liked ? "bg-white text-black" : ""
                        }`}
                        title={content.is_liked ? "Unlike" : "Like"}
                      >
                        👍
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* Title and metadata below image */}
      <div className="mt-2">
        <h4 className="font-medium text-sm line-clamp-2">{content.title}</h4>
        <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
          <span>{formatReleaseYear(content.release_date)}</span>
          {content.user_rating && (
            <>
              <span>•</span>
              <span>⭐ {content.user_rating}/5</span>
            </>
          )}
          {content.genres.length > 0 && (
            <>
              <span>•</span>
              <span>{content.genres.slice(0, 2).join(", ")}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
