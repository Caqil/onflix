"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ContentGrid, ContentLoadingSkeleton, Pagination } from "@/components";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  TrendingUp,
  Star,
  Calendar,
  Play,
  Grid3X3,
  List,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";
import { GENRES, API_CONFIG } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/helpers";
import { toast } from "sonner";
import type {
  Content,
  ContentType,
  SortOption,
  PaginatedResponse,
} from "@/types";

// API service functions
const apiCall = async (endpoint: string) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Filters component
function ContentFiltersSection({
  onFiltersChange,
  loading = false,
}: {
  onFiltersChange: (filters: any) => void;
  loading?: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [selectedSort, setSelectedSort] = useState<string>("popularity");
  const [showFilters, setShowFilters] = useState(false);

  const handleFiltersChange = () => {
    onFiltersChange({
      search: searchQuery || undefined,
      type: selectedType || undefined,
      genre: selectedGenre || undefined,
      sort: selectedSort as SortOption,
    });
  };

  useEffect(() => {
    const timeoutId = setTimeout(handleFiltersChange, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedType, selectedGenre, selectedSort]);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search movies and TV shows..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          disabled={loading}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={showFilters ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          disabled={loading}
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filters
        </Button>

        <Select
          value={selectedSort}
          onValueChange={setSelectedSort}
          disabled={loading}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popularity">Popularity</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
            <SelectItem value="release_date">Release Date</SelectItem>
            <SelectItem value="title">Title</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Extended Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Content Type
                </label>
                <Select
                  value={selectedType}
                  onValueChange={setSelectedType}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="movie">Movies</SelectItem>
                    <SelectItem value="tv_show">TV Shows</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Genre</label>
                <Select
                  value={selectedGenre}
                  onValueChange={setSelectedGenre}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All genres" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Genres</SelectItem>
                    {(GENRES || []).map((genre) => (
                      <SelectItem key={genre} value={genre.toLowerCase()}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => {
                  setSelectedType("");
                  setSelectedGenre("");
                  setSelectedSort("popularity");
                  setSearchQuery("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Featured content section
function FeaturedSection({ content }: { content: Content[] }) {
  const featuredContent = content[0]; // Use first item as featured

  if (!featuredContent) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-5 h-5 text-yellow-500" />
        <h2 className="text-2xl font-bold">Featured Content</h2>
      </div>

      <div className="relative rounded-xl overflow-hidden">
        {/* Background Image */}
        {featuredContent.backdrop_url && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${featuredContent.backdrop_url})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

        <div className="relative p-8 md:p-12 text-white">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-primary">Featured</Badge>
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              {featuredContent.title}
            </h3>
            <p className="text-lg mb-6 opacity-90 line-clamp-3">
              {featuredContent.description}
            </p>
            <div className="flex items-center gap-4 mb-6">
              {featuredContent.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{featuredContent.rating.toFixed(1)}</span>
                </div>
              )}
              <span>
                {new Date(featuredContent.release_date).getFullYear()}
              </span>
              <Badge variant="outline" className="text-white border-white">
                {featuredContent.type === "movie" ? "Movie" : "TV Show"}
              </Badge>
            </div>
            <div className="flex gap-4">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-white/90"
              >
                <Play className="w-5 h-5 mr-2" />
                Play Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                More Info
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Trending section
function TrendingSection({ loading }: { loading: boolean }) {
  const [trendingContent, setTrendingContent] = useState<Content[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await apiCall("/api/v1/content/trending");
        setTrendingContent(response.data || []);
      } catch (error) {
        console.error("Failed to fetch trending content:", error);
        setTrendingContent([]);
      } finally {
        setTrendingLoading(false);
      }
    };

    fetchTrending();
  }, []);

  if (trendingLoading) {
    return (
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Loader2 className="w-5 h-5 animate-spin" />
          <h2 className="text-2xl font-bold">Loading Trending...</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
              <div className="h-4 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (trendingContent.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-red-500" />
        <h2 className="text-2xl font-bold">Trending Now</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {trendingContent.slice(0, 6).map((content, index) => (
          <div key={content.id} className="relative group cursor-pointer">
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden">
              <img
                src={content.poster_url}
                alt={content.title}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/300x450/374151/ffffff?text=No+Image";
                }}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play className="w-8 h-8 text-white" />
              </div>
              <Badge className="absolute top-2 left-2 bg-red-500">
                #{index + 1}
              </Badge>
            </div>
            <h3 className="mt-2 font-medium text-sm line-clamp-2">
              {content.title}
            </h3>
          </div>
        ))}
      </div>
    </section>
  );
}

// Main component
function BrowseContent() {
  const searchParams = useSearchParams();
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Initialize filters from URL params
  useEffect(() => {
    const urlFilters = {
      search: searchParams.get("q") || "",
      type: searchParams.get("type") || "",
      genre: searchParams.get("genre") || "",
      sort: searchParams.get("sort") || "popularity",
      trending: searchParams.get("trending") === "true",
    };
    setFilters(urlFilters);
  }, [searchParams]);

  // Fetch content from API
  const fetchContent = async (newFilters: any, page: number = 1) => {
    setLoading(true);

    try {
      let endpoint = "/api/v1/content";
      const params = new URLSearchParams();

      // Add pagination
      params.append("page", page.toString());
      params.append("limit", "20");

      // Handle different content types
      if (newFilters.search) {
        endpoint = "/api/v1/content/search";
        params.append("q", newFilters.search);
      } else if (newFilters.trending) {
        endpoint = "/api/v1/content/trending";
      } else if (newFilters.genre) {
        endpoint = `/api/v1/content/genres/${newFilters.genre}`;
      }

      // Add other filters
      if (newFilters.type) params.append("type", newFilters.type);
      if (newFilters.sort) params.append("sort", newFilters.sort);

      const fullEndpoint = `${endpoint}?${params.toString()}`;
      const response: PaginatedResponse<Content> = await apiCall(fullEndpoint);

      if (response.data) {
        setContent(response.data || []);
        if (response.pagination) {
          setCurrentPage(response.pagination.current_page);
          setTotalPages(response.pagination.total_pages);
          setTotalItems(response.pagination.total_items);
        }
      } else {
        setContent([]);
        toast.error("Failed to fetch content");
      }
    } catch (error) {
      console.error("Failed to fetch content:", error);
      setContent([]);
      toast.error("Failed to load content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    fetchContent(newFilters, 1);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchContent(filters, page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Initial load
  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      fetchContent(filters);
    }
  }, [filters]);

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Featured Content - only show if no search */}
      {!filters.search && !loading && content.length > 0 && (
        <FeaturedSection content={content} />
      )}

      {/* Trending Now - only show if no search */}
      {!filters.search && <TrendingSection loading={loading} />}

      {/* Filters */}
      <ContentFiltersSection
        onFiltersChange={handleFiltersChange}
        loading={loading}
      />

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {filters.search
              ? `Search Results for "${filters.search}"`
              : filters.trending
              ? "Trending Content"
              : filters.genre
              ? `${filters.genre} Movies & Shows`
              : "All Content"}
          </h2>
          {!loading && (
            <p className="text-muted-foreground">{totalItems} results found</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            disabled={loading}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            disabled={loading}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <ContentLoadingSkeleton viewMode={viewMode} />
      ) : (
        <ContentGrid
          content={content}
          viewMode={viewMode}
          className="min-h-[400px]"
        />
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            showPageInfo={true}
          />
        </div>
      )}

      {/* Empty State */}
      {!loading && content.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No content found</h3>
          <p className="text-muted-foreground mb-4">
            {filters.search
              ? "No content matches your search criteria"
              : "No content available at the moment"}
          </p>
          <Button onClick={() => handleFiltersChange({})}>
            {filters.search ? "Clear search" : "Refresh"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<ContentLoadingSkeleton />}>
      <BrowseContent />
    </Suspense>
  );
}
