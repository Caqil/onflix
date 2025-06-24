"use client";

import { useState, useRef } from "react";
import { Content } from "@/lib/types";
import ContentCard from "./ContentCard";

interface ContentCarouselProps {
  content: Content[] | null | undefined;
  title: string;
  profileId?: string;
  isLoading?: boolean;
  error?: string | null;
}

export function ContentCarousel({
  content,
  title,
  profileId,
  isLoading = false,
  error = null,
}: ContentCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 320; // Approximate width of one item
      const newScrollLeft =
        scrollRef.current.scrollLeft +
        (direction === "left" ? -scrollAmount : scrollAmount);

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

  // Handle loading state
  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <div className="flex space-x-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 w-48 animate-pulse">
              <div className="aspect-[2/3] bg-gray-300 rounded-lg"></div>
              <div className="mt-2 h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">
            Failed to load {title.toLowerCase()}: {error}
          </p>
        </div>
      </div>
    );
  }

  // Handle empty/null content
  if (!content || !Array.isArray(content) || content.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No content available in this category</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 relative group">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>

      <div className="relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ←
          </button>
        )}

        {/* Content Scroll Container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex space-x-4 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {content.map((item) => (
            <div key={item.id} className="flex-shrink-0 w-48">
              <ContentCard content={item} profileId={profileId} />
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        {showRightArrow && content.length > 6 && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            →
          </button>
        )}
      </div>
    </div>
  );
}
