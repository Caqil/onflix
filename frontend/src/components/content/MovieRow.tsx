import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { ContentItem, ContentSearchParams } from "../../services/content";
import { contentService } from "../../services/content";
import MovieCard from "./MovieCard";
import { Button } from "../ui/button";
import { MovieCardSkeleton } from "../common/Loading";
import { cn } from "../../utils/helpers";

interface MovieRowProps {
  title: string;
  content?: ContentItem[];
  loading?: boolean;
  showTitle?: boolean;
  size?: "sm" | "md" | "lg";
  layout?: "horizontal" | "vertical";
  autoPlayTrailers?: boolean;
  genre?: string;
  type?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  limit?: number;
  className?: string;
}

const MovieRow: React.FC<MovieRowProps> = ({
  title,
  content: providedContent = [],
  loading: providedLoading = false,
  showTitle = true,
  size = "md",
  layout = "horizontal",
  autoPlayTrailers = false,
  genre,
  type,
  sortBy,
  sortOrder,
  limit = 20,
  className,
}) => {
  const [content, setContent] = useState<ContentItem[]>(providedContent);
  const [loading, setLoading] = useState(providedLoading);
  const [error, setError] = useState<string | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUsingProvidedContent = providedContent.length > 0;

  // Fetch content if not provided
  useEffect(() => {
    if (!isUsingProvidedContent) {
      fetchContent();
    } else {
      setContent(providedContent);
      setLoading(providedLoading);
    }
  }, [
    isUsingProvidedContent,
    providedContent,
    providedLoading,
    genre,
    type,
    sortBy,
    sortOrder,
  ]);

  // Update scroll buttons visibility
  useEffect(() => {
    updateScrollButtons();
  }, [content, scrollPosition]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: ContentSearchParams = {
        limit,
        page: 1,
        sortBy: sortBy as any,
        sortOrder,
        filters: {},
      };

      if (genre) {
        params.filters!.genre = [genre];
      }

      if (type) {
        params.filters!.type = [type];
      }

      const response = await contentService.getContent(params);
      setContent(response.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch content");
    } finally {
      setLoading(false);
    }
  };

  const updateScrollButtons = () => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const { scrollLeft, scrollWidth, clientWidth } = container;

    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    setScrollPosition(scrollLeft);
  };

  const handleScroll = () => {
    updateScrollButtons();
  };

  const scrollLeft = () => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const cardWidth = size === "sm" ? 140 : size === "md" ? 180 : 220;
    const scrollAmount = cardWidth * 3;

    container.scrollBy({
      left: -scrollAmount,
      behavior: "smooth",
    });
  };

  const scrollRight = () => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const cardWidth = size === "sm" ? 140 : size === "md" ? 180 : 220;
    const scrollAmount = cardWidth * 3;

    container.scrollBy({
      left: scrollAmount,
      behavior: "smooth",
    });
  };

  const getCardSpacing = () => {
    switch (size) {
      case "sm":
        return "gap-3";
      case "md":
        return "gap-4";
      case "lg":
        return "gap-6";
      default:
        return "gap-4";
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className={cn("flex", getCardSpacing())}>
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="flex-shrink-0">
              <MovieCardSkeleton />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center py-12 text-center">
          <div>
            <p className="text-destructive mb-2">{error}</p>
            <Button onClick={fetchContent} size="sm">
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    if (content.length === 0) {
      return (
        <div className="flex items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">No content available</p>
        </div>
      );
    }

    return (
      <div className={cn("flex", getCardSpacing())}>
        {content.map((item) => (
          <div key={item.id} className="flex-shrink-0">
            <MovieCard
              content={item}
              size={size}
              showDetails={size !== "sm"}
              autoPlayTrailer={autoPlayTrailers}
              layout={layout === "vertical" ? "landscape" : "portrait"}
            />
          </div>
        ))}
      </div>
    );
  };

  if (layout === "vertical") {
    return (
      <div className={cn("space-y-4", className)}>
        {showTitle && (
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{title}</h2>
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {loading ? (
            Array.from({ length: 10 }).map((_, index) => (
              <MovieCardSkeleton key={index} />
            ))
          ) : error ? (
            <div className="col-span-full flex items-center justify-center py-12 text-center">
              <div>
                <p className="text-destructive mb-2">{error}</p>
                <Button onClick={fetchContent} size="sm">
                  Try Again
                </Button>
              </div>
            </div>
          ) : content.length === 0 ? (
            <div className="col-span-full flex items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">No content available</p>
            </div>
          ) : (
            content.map((item) => (
              <MovieCard
                key={item.id}
                content={item}
                size={size}
                showDetails={size !== "sm"}
                autoPlayTrailer={autoPlayTrailers}
                layout="landscape"
              />
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {showTitle && (
        <div className="flex items-center justify-between px-4 md:px-6 lg:px-8">
          <h2 className="text-xl font-bold">{title}</h2>
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      )}

      <div className="relative group">
        {/* Left Scroll Button */}
        <Button
          onClick={scrollLeft}
          variant="outline"
          size="icon"
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 border-white/20 text-white hover:bg-black/70 transition-opacity duration-300",
            canScrollLeft
              ? "opacity-0 group-hover:opacity-100"
              : "opacity-0 pointer-events-none"
          )}
          disabled={!canScrollLeft}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Right Scroll Button */}
        <Button
          onClick={scrollRight}
          variant="outline"
          size="icon"
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 border-white/20 text-white hover:bg-black/70 transition-opacity duration-300",
            canScrollRight
              ? "opacity-0 group-hover:opacity-100"
              : "opacity-0 pointer-events-none"
          )}
          disabled={!canScrollRight}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Scrollable Content */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-hide px-4 md:px-6 lg:px-8"
          onScroll={handleScroll}
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default MovieRow;
