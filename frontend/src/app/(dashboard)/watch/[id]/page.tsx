"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { VideoPlayer } from "@/components/content/VideoPlayer";
import { useContent } from "@/hooks/useContent";
import { LoadingSpinner } from "@/components/layout/LoadingSpinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const contentId = params?.id as string;
  const { currentContent, fetchContentById, isLoading } = useContent();

  useEffect(() => {
    if (contentId) {
      fetchContentById(contentId);
    }
  }, [contentId, fetchContentById]);

  const handleClose = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentContent) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Content Not Found</h1>
          <p className="text-gray-400">
            The content you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black">
        <VideoPlayer
          contentId={contentId}
          title={currentContent.title}
          autoPlay
          onClose={handleClose}
        />
      </div>
    </ProtectedRoute>
  );
}
