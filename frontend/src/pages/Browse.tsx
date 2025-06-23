import React, { useState, useEffect } from "react";
import { Filter, Grid, List } from "lucide-react";
import { useContent } from "../hooks/useContent";
import { contentService } from "../services/content";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MovieCard from "@/components/content/MovieCard";
import Loading, { MovieCardSkeleton } from "../components/common/Loading";
import { GENRES, CONTENT_TYPES } from "../utils/constants";

const Browse: React.FC = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState({
    type: "",
    genre: "",
    sortBy: "createdAt" as
      | "title"
      | "releaseDate"
      | "rating"
      | "viewCount"
      | "createdAt",
    sortOrder: "desc" as "asc" | "desc",
  });
  const [showFilters, setShowFilters] = useState(false);

  const { content, loading, error, pagination, fetchContent, loadMore } =
    useContent({
      limit: 20,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    });

  // Update content when filters change
  useEffect(() => {
    const searchFilters: any = {};
    if (filters.type) searchFilters.type = [filters.type];
    if (filters.genre) searchFilters.genre = [filters.genre];

    fetchContent({
      page: 1,
      filters: searchFilters,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    });
  }, [filters, fetchContent]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      type: "",
      genre: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => fetchContent({ page: 1 })}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Browse Content</h1>
            <p className="text-muted-foreground">
              Discover movies, TV shows, and documentaries
            </p>
          </div>

          <div className="flex items-center gap-4 mt-4 md:mt-0">
            {/* View Mode Toggle */}
            <div className="flex items-center border rounded-lg">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-card border rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Content Type Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select
                  value={filters.type}
                  onValueChange={(value) => handleFilterChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value={CONTENT_TYPES.MOVIE}>Movies</SelectItem>
                    <SelectItem value={CONTENT_TYPES.TV_SHOW}>
                      TV Shows
                    </SelectItem>
                    <SelectItem value={CONTENT_TYPES.DOCUMENTARY}>
                      Documentaries
                    </SelectItem>
                    <SelectItem value={CONTENT_TYPES.SHORT_FILM}>
                      Short Films
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Genre Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Genre</label>
                <Select
                  value={filters.genre}
                  onValueChange={(value) => handleFilterChange("genre", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Genres" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Genres</SelectItem>
                    {GENRES.map((genre) => (
                      <SelectItem key={genre.id} value={genre.id}>
                        {genre.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Sort By
                </label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => handleFilterChange("sortBy", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Recently Added</SelectItem>
                    <SelectItem value="releaseDate">Release Date</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="viewCount">Popularity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="text-sm font-medium mb-2 block">Order</label>
                <Select
                  value={filters.sortOrder}
                  onValueChange={(value) =>
                    handleFilterChange("sortOrder", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        )}

        {/* Results Count */}
        {!loading && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              Showing {content.length} of {pagination.total} results
            </p>
          </div>
        )}

        {/* Content Grid */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {content.map((item) => (
              <MovieCard key={item.id} content={item} />
            ))}

            {/* Loading Skeletons */}
            {loading &&
              Array.from({ length: 12 }).map((_, i) => (
                <MovieCardSkeleton key={i} />
              ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            {content.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 bg-card border rounded-lg"
              >
                <img
                  src={item.poster}
                  alt={item.title}
                  className="w-16 h-24 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    {item.releaseDate} • {item.type.replace("_", " ")} •{" "}
                    {item.genre.join(", ")}
                  </p>
                  <p className="text-sm line-clamp-2">{item.description}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-yellow-500">★</span>
                    <span className="text-sm">{item.rating.toFixed(1)}</span>
                  </div>
                  <Button size="sm">Watch</Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {pagination.page < pagination.totalPages && (
          <div className="flex justify-center mt-8">
            <Button
              onClick={loadMore}
              disabled={loading}
              variant="outline"
              size="lg"
            >
              {loading ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && content.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No content found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or search criteria
            </p>
            <Button onClick={clearFilters}>Clear Filters</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Browse;
