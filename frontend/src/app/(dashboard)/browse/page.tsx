"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { ContentGrid } from "@/components/content/ContentGrid";
import { GenreFilter } from "@/components/content/GenreFilter";
import { useContentStore } from "@/hooks/useContent";
import { LoadingSpinner } from "@/components/layout/LoadingSpinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { contentAPI } from "@/lib/api";
import { Content, Genre } from "@/lib/types";

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const { genres } = useContentStore();
  const [content, setContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const selectedGenre = searchParams?.get("genre") || "";
  const contentType = searchParams?.get("type") || "";

  useEffect(() => {
    fetchContent();
  }, [selectedGenre, contentType, currentPage]);

  const fetchContent = async () => {
    setIsLoading(true);
    try {
      let response;

      if (selectedGenre) {
        response = await contentAPI.getByGenre(selectedGenre, {
          page: currentPage,
          limit: 20,
        });
      } else {
        const filters: any = { page: currentPage, limit: 20 };
        if (contentType) {
          filters.type = contentType;
        }
        response = await contentAPI.browse(filters);
      }

      setContent(response.data.data!);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error("Failed to fetch content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPageTitle = () => {
    if (selectedGenre) {
      const genre = genres.find((g) => g.slug === selectedGenre);
      return genre ? `${genre.name} Movies & Shows` : "Browse Content";
    }
    if (contentType === "movie") return "Movies";
    if (contentType === "tv_show") return "TV Shows";
    return "Browse All Content";
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black">
        <Header />

        <div className="pt-16">
          {/* Page Header */}
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-4xl font-bold text-white mb-6">
              {getPageTitle()}
            </h1>

            {/* Filters */}
            <GenreFilter
              genres={genres}
              selectedGenre={selectedGenre}
              selectedType={contentType}
            />
          </div>

          {/* Content Grid */}
          <div className="px-4 sm:px-6 lg:px-8 pb-8">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <>
                <ContentGrid content={content} />

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-8 gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="flex items-center px-4 text-white">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
