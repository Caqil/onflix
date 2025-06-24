"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Content } from "@/lib/types";
import { ContentCard } from "./ContentCard";
import { Button } from "@/components/ui/button";

interface ContentCarouselProps {
  title: string;
  content: Content[];
  priority?: boolean;
}

export function ContentCarousel({
  title,
  content,
  priority = false,
}: ContentCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (content.length === 0) return null;

  return (
    <div className="relative group px-4 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>

      <div className="relative">
        {/* Left Arrow */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        {/* Content Scroll */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {content.map((item) => (
            <div key={item.id} className="flex-shrink-0">
              <ContentCard content={item} />
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
