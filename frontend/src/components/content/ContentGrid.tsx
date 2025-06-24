"use client";

import { Content } from "@/lib/types";
import ContentCard from "./ContentCard";

interface ContentGridProps {
  content: Content[] | null | undefined;
  profileId?: string;
  title?: string;
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  className?: string;
}

export function ContentGrid({
  content,
  profileId,
  title,
  isLoading = false,
  error = null,
  emptyMessage = "No content found",
  className = "",
}: ContentGridProps) {
  // Handle loading state
  if (isLoading) {
    return (
      <div className={`${className}`}>
        {title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="aspect-[2/3] bg-gray-300 rounded-lg"></div>
              <div className="mt-2 h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="mt-1 h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className={`${className}`}>
        {title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
        <div className="text-center py-12">
          <div className="text-red-500 text-lg mb-2">
            ⚠️ Error Loading Content
          </div>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Handle null, undefined, or empty array
  if (!content || !Array.isArray(content) || content.length === 0) {
    return (
      <div className={`${className}`}>
        {title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📺</div>
          <p className="text-gray-400 text-lg">{emptyMessage}</p>
          <p className="text-gray-500 text-sm mt-2">
            Check back later for new content!
          </p>
        </div>
      </div>
    );
  }

  // Render content grid
  return (
    <div className={`${className}`}>
      {title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {content.map((item) => (
          <ContentCard key={item.id} content={item} profileId={profileId} />
        ))}
      </div>
    </div>
  );
}
