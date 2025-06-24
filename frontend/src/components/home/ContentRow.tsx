"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Content } from "@/lib/types";
import ContentCard from "@/components/content/ContentCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ContentRowProps {
  title: string;
  content: Content[];
  priority?: boolean;
  variant?: "small" | "medium" | "large";
  showBadge?: boolean;
  showProgress?: boolean;
}

export function ContentRow({
  title,
  content,
  priority = false,
  variant = "medium",
  showBadge = false,
  showProgress = false,
}: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      const newScrollLeft =
        direction === "left"
          ? scrollRef.current.scrollLeft - scrollAmount
          : scrollRef.current.scrollLeft + scrollAmount;

      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const cardSizes = {
    small: "w-48 h-28",
    medium: "w-64 h-36",
    large: "w-80 h-48",
  };

  if (content.length === 0) return null;

  return (
    <div className="relative group px-4 sm:px-6 lg:px-8">
      {/* Section Title */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
          {title}
          {showBadge && (
            <span className="ml-3 text-sm bg-red-600 text-white px-2 py-1 rounded">
              NEW
            </span>
          )}
        </h2>
        <div className="text-sm text-gray-400 hidden sm:block">
          {content.length} {content.length === 1 ? "title" : "titles"}
        </div>
      </div>

      <div className="relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-30 bg-black/80 hover:bg-black/90 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-16 w-12 rounded-r-md"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}

        {/* Content Scroll Container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-2 sm:gap-3 lg:gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {content.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                "flex-shrink-0 transition-transform duration-300 hover:scale-105",
                cardSizes[variant]
              )}
            >
              <ContentCard
                content={item}
                variant={variant}
                showProgress={showProgress}
                priority={priority && index < 6}
              />
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        {showRightArrow && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-30 bg-black/80 hover:bg-black/90 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-16 w-12 rounded-l-md"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        )}
      </div>
    </div>
  );
}
