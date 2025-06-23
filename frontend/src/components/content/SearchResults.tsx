import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Search,
  Grid,
  List,
  SlidersHorizontal,
  X,
  Star,
  Calendar,
  Clock,
} from "lucide-react";
import { useContentSearch } from "../../hooks/useContent";
import { GENRES } from "../../utils/constants";
import MovieCard from "./MovieCard";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { MovieCardSkeleton } from "../common/Loading";
import { formatDate, formatDuration, cn } from "../../utils/helpers";

interface SearchFilters {
  type: string;
  genre: string;
  year: string;
  rating: string;
  duration: string;
  sortBy:
    | "relevance"
    | "rating"
    | "title"
    | "releaseDate"
    | "viewCount"
    | "createdAt"
    | undefined;
  sortOrder: string;
}

const SearchResults: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const {
    query,
    setQuery,
    suggestions,
    content,
    loading,
    error,
    search,
    clearSearch,
  } = useContentSearch();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    type: "",
    genre: "",
    year: "",
    rating: "",
    duration: "",
    sortBy: "relevance",
    sortOrder: "desc",
  });

  // Set initial query from URL
  useEffect(() => {
    if (initialQuery && initialQuery !== query) {
      setQuery(initialQuery);
      search(initialQuery);
    }
  }, [initialQuery, query, search, setQuery]);

  // Update URL when query changes
  useEffect(() => {
    if (query) {
      setSearchParams({ q: query });
    } else {
      setSearchParams({});
    }
  }, [query, setSearchParams]);

  const handleSearch = (searchQuery: string) => {
    search(searchQuery, {
      filters: getFiltersObject(),
      sortBy: filters.sortBy as any,
      sortOrder: filters.sortOrder as any,
    });
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    if (query) {
      search(query, {
        filters: getFiltersObject(newFilters),
        sortBy: newFilters.sortBy as any,
        sortOrder: newFilters.sortOrder as any,
      });
    }
  };

  const getFiltersObject = (customFilters?: SearchFilters) => {
    const activeFilters = customFilters || filters;
    const filtersObj: any = {};

    if (activeFilters.type) filtersObj.type = [activeFilters.type];
    if (activeFilters.genre) filtersObj.genre = [activeFilters.genre];

    return filtersObj;
  };

  const clearAllFilters = () => {
    const clearedFilters: SearchFilters = {
      type: "",
      genre: "",
      year: "",
      rating: "",
      duration: "",
      sortBy: "relevance",
      sortOrder: "desc",
    };
    setFilters(clearedFilters);

    if (query) {
      search(query, {
        filters: {},
        sortOrder: "desc",
      });
    }
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(
      (value) => value && value !== "relevance" && value !== "desc"
    ).length;
  };

  const renderSuggestions = () => {
    if (!query || suggestions.length === 0) return null;

    return (
      <Card className="absolute top-full left-0 right-0 mt-1 z-10 border shadow-lg">
        <CardContent className="p-2">
          <div className="space-y-1">
            {suggestions.slice(0, 8).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  setQuery(suggestion);
                  handleSearch(suggestion);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded flex items-center gap-2"
              >
                <Search className="h-3 w-3 text-muted-foreground" />
                <span className="truncate">{suggestion}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderFilters = () => (
    <Card
      className={cn(
        "transition-all duration-300",
        showFilters ? "block" : "hidden"
      )}
    >
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Select
            value={filters.type}
            onValueChange={(value) => handleFilterChange("type", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="movie">Movies</SelectItem>
              <SelectItem value="tv_show">TV Shows</SelectItem>
              <SelectItem value="documentary">Documentaries</SelectItem>
              <SelectItem value="short_film">Short Films</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.genre}
            onValueChange={(value) => handleFilterChange("genre", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Genre" />
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

          <Select
            value={filters.year}
            onValueChange={(value) => handleFilterChange("year", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any Year</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
              <SelectItem value="2021">2021</SelectItem>
              <SelectItem value="2020">2020</SelectItem>
              <SelectItem value="2010-2019">2010s</SelectItem>
              <SelectItem value="2000-2009">2000s</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.rating}
            onValueChange={(value) => handleFilterChange("rating", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any Rating</SelectItem>
              <SelectItem value="9+">9.0+ ⭐</SelectItem>
              <SelectItem value="8+">8.0+ ⭐</SelectItem>
              <SelectItem value="7+">7.0+ ⭐</SelectItem>
              <SelectItem value="6+">6.0+ ⭐</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.sortBy}
            onValueChange={(value) => handleFilterChange("sortBy", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="releaseDate">Release Date</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="viewCount">Popularity</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button
              onClick={clearAllFilters}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Clear All
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderGridView = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {content.map((item) => (
        <MovieCard
          key={item.id}
          content={item}
          size="md"
          showDetails={true}
          autoPlayTrailer={false}
        />
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-4">
      {content.map((item) => (
        <Card
          key={item.id}
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => navigate(`/browse/${item.id}`)}
        >
          <CardContent className="p-4">
            <div className="flex gap-4">
              <img
                src={item.poster}
                alt={item.title}
                className="w-20 h-28 object-cover rounded"
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {item.rating.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(item.releaseDate).split(",")[1]}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDuration(item.duration)}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {item.type.replace("_", " ")}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.description}
                </p>

                <div className="flex gap-1">
                  {item.genre.slice(0, 4).map((genre) => (
                    <Badge key={genre} variant="secondary" className="text-xs">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderResults = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => handleSearch(query)}>Try Again</Button>
        </div>
      );
    }

    if (!query) {
      return (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Search for movies and shows
          </h3>
          <p className="text-muted-foreground">
            Enter a title, actor, director, or genre to find content
          </p>
        </div>
      );
    }

    if (content.length === 0) {
      return (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No results found</h3>
          <p className="text-muted-foreground mb-4">
            No content found for "{query}". Try adjusting your search or
            filters.
          </p>
          <div className="flex justify-center gap-2">
            <Button onClick={() => setQuery("")} variant="outline">
              Clear Search
            </Button>
            <Button onClick={clearAllFilters} variant="outline">
              Clear Filters
            </Button>
          </div>
        </div>
      );
    }

    return viewMode === "grid" ? renderGridView() : renderListView();
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch(query);
                }
              }}
              placeholder="Search for movies, TV shows, actors, directors..."
              className="pl-10 pr-10 h-12 text-base"
            />
            {query && (
              <Button
                onClick={() => {
                  setQuery("");
                  clearSearch();
                }}
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {renderSuggestions()}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            {query && (
              <p className="text-sm text-muted-foreground">
                {loading
                  ? "Searching..."
                  : `${content.length} results for "${query}"`}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex border rounded-lg">
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
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {getActiveFiltersCount() > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                >
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {renderFilters()}

      {/* Results */}
      {renderResults()}
    </div>
  );
};

export default SearchResults;
