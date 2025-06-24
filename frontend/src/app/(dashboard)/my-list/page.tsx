"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { ContentGrid } from "@/components/content/ContentGrid";
import { LoadingSpinner } from "@/components/layout/LoadingSpinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { userAPI } from "@/lib/api";
import { Content } from "@/lib/types";
import { Filter } from "lucide-react";

export default function MyListPage() {
  const [watchlist, setWatchlist] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState("added_date");
  const [filterType, setFilterType] = useState("");

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      setIsLoading(true);
      const response = await userAPI.getWatchlist();
      setWatchlist(response.data.data!);
    } catch (error) {
      console.error("Failed to fetch watchlist:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContent = watchlist.filter((item) => {
    if (!filterType) return true;
    return item.type === filterType;
  });

  const sortedContent = [...filteredContent].sort((a, b) => {
    switch (sortBy) {
      case "title":
        return a.title.localeCompare(b.title);
      case "release_date":
        return (
          new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
        );
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      default: // added_date
        return 0; // Would need actual added date from API
    }
  });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black">
        <Header />

        <div className="pt-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">My List</h1>
                <p className="text-gray-400">
                  {watchlist.length}{" "}
                  {watchlist.length === 1 ? "title" : "titles"}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40 bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="movie">Movies</SelectItem>
                    <SelectItem value="tv_show">TV Shows</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="added_date">Date Added</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="release_date">Release Date</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : watchlist.length === 0 ? (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Your list is empty
                  </h2>
                  <p className="text-gray-400 mb-6">
                    Add movies and TV shows to your list to watch them later.
                  </p>
                  <Button className="bg-red-600 hover:bg-red-700">
                    Browse Content
                  </Button>
                </div>
              </div>
            ) : (
              <ContentGrid content={sortedContent} />
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
