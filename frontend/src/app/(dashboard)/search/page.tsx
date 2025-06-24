"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { ContentGrid } from "@/components/content/ContentGrid";
import { LoadingSpinner } from "@/components/layout/LoadingSpinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useContent } from "@/hooks/useContent";
import { SearchFilters } from "@/components/content/SearchFilters";
import { Content } from "@/lib/types";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams?.get("q") || "";
  const { searchContent, searchResults, isLoading, clearSearch } = useContent();
  const [filters, setFilters] = useState<any>({
    query,
    genre: "",
    type: "",
    year: undefined,
    rating: undefined,
    sortBy: "popularity",
    sortOrder: "desc",
  });

  useEffect(() => {
    if (query) {
      handleSearch({ ...filters, query });
    } else {
      clearSearch();
    }
  }, [query]);

  const handleSearch = async (searchFilters: any) => {
    await searchContent(searchFilters);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    handleSearch(newFilters);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black">
        <Header />

        <div className="pt-16">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {/* Search Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">
                {query ? `Search Results for "${query}"` : "Search"}
              </h1>
              {searchResults.length > 0 && (
                <p className="text-gray-400">
                  Found {searchResults.length} results
                </p>
              )}
            </div>

            {/* Search Filters */}
            <SearchFilters
              filters={filters}
              onFilterChange={handleFilterChange}
            />

            {/* Results */}
            <div className="mt-8">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : query && searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg">
                    No results found for "{query}"
                  </p>
                  <p className="text-gray-500 mt-2">
                    Try adjusting your search terms or filters
                  </p>
                </div>
              ) : (
                <ContentGrid content={searchResults} />
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
