"use client";

import { Content } from "@/lib/types";
import { ContentCard } from "./ContentCard";

interface ContentGridProps {
  content: Content[];
}

export function ContentGrid({ content }: ContentGridProps) {
  if (content.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">No content found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {content.map((item) => (
        <ContentCard key={item.id} content={item} />
      ))}
    </div>
  );
}
