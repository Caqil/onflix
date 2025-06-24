"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Filter, Clock, ChevronDown } from "lucide-react";
import { useDebounce } from "../../hooks/use-debounce";
import { storage } from "../../lib/utils/helpers";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ContentFilters, ContentGrid } from "..";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { CONTENT_TYPES, GENRES } from "@/lib/utils/constants";
import { Label } from "../ui/label";
import { useContentSearch } from "@/hooks/use-content";
import { cn } from "@/lib/utils/helpers";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
  autoFocus?: boolean;
  showClearButton?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search movies, TV shows...",
  onSearch,
  className,
  autoFocus = false,
  showClearButton = true,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with URL query parameter if present
  const [query, setQuery] = useState(() => searchParams?.get("q") || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  // Get recent searches from storage
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return storage.get("recent_searches", []);
    } catch (error) {
      console.warn("Failed to load recent searches:", error);
      return [];
    }
  });

  // Focus input on mount if autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Handle URL query parameter changes
  useEffect(() => {
    const urlQuery = searchParams?.get("q") || "";
    if (urlQuery !== query) {
      setQuery(urlQuery);
    }
  }, [searchParams]);

  const saveToRecentSearches = useCallback(
    (searchQuery: string) => {
      try {
        const updatedRecent = [
          searchQuery,
          ...recentSearches.filter((item) => item !== searchQuery),
        ].slice(0, 5);

        setRecentSearches(updatedRecent);
        storage.set("recent_searches", updatedRecent);
      } catch (error) {
        console.warn("Failed to save recent search:", error);
      }
    },
    [recentSearches]
  );

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) return;

      setIsSearching(true);
      setShowSuggestions(false);

      try {
        // Save to recent searches
        saveToRecentSearches(searchQuery.trim());

        // Execute search
        if (onSearch) {
          onSearch(searchQuery.trim());
        } else {
          router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    },
    [onSearch, router, saveToRecentSearches]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setQuery("");
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setShowSuggestions(false);
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      storage.remove("recent_searches");
    } catch (error) {
      console.warn("Failed to clear recent searches:", error);
    }
  };

  const removeRecentSearch = (searchToRemove: string) => {
    const updatedRecent = recentSearches.filter(
      (item) => item !== searchToRemove
    );
    setRecentSearches(updatedRecent);
    try {
      storage.set("recent_searches", updatedRecent);
    } catch (error) {
      console.warn("Failed to remove recent search:", error);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search
            className={cn(
              "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4",
              isSearching
                ? "text-primary animate-pulse"
                : "text-muted-foreground"
            )}
          />
          <Input
            ref={inputRef}
            type="search"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={handleKeyDown}
            className="pl-9 pr-12"
            disabled={isSearching}
            aria-label="Search content"
          />
          {showClearButton && query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </form>

      {/* Search Suggestions */}
      {showSuggestions && recentSearches.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-80 overflow-hidden">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Recent Searches</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearRecentSearches}
                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {recentSearches.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between group hover:bg-muted rounded"
                >
                  <button
                    onClick={() => handleSearch(item)}
                    className="flex items-center flex-1 p-2 text-left text-sm"
                  >
                    <Clock className="w-3 h-3 mr-2 text-muted-foreground" />
                    <span className="truncate">{item}</span>
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecentSearch(item);
                    }}
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 mr-1"
                    aria-label={`Remove "${item}" from recent searches`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface SearchFiltersProps {
  filters: ContentFilters;
  onFiltersChange: (filters: ContentFilters) => void;
  className?: string;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = useCallback(
    (key: keyof ContentFilters, value: any) => {
      onFiltersChange({ ...filters, [key]: value });
    },
    [filters, onFiltersChange]
  );

  const clearFilters = useCallback(() => {
    onFiltersChange({
      page: 1,
      limit: filters.limit || 20,
    });
  }, [filters.limit, onFiltersChange]);

  const activeFiltersCount = Object.keys(filters).filter(
    (key) =>
      key !== "page" &&
      key !== "limit" &&
      key !== "q" &&
      filters[key as keyof ContentFilters] !== undefined &&
      filters[key as keyof ContentFilters] !== ""
  ).length;

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={hasActiveFilters ? "default" : "outline"}
          size="sm"
          className={cn("relative", className)}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          <ChevronDown className="w-3 h-3 ml-1" />
          {hasActiveFilters && (
            <Badge
              variant="secondary"
              className="ml-2 text-xs min-w-[1.25rem] h-5 rounded-full"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filters</h4>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                Clear all
              </Button>
            )}
          </div>

          {/* Content Type */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Content Type
            </Label>
            <div className="space-y-2">
              {Object.values(CONTENT_TYPES).map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={filters.type === type}
                    onCheckedChange={(checked) =>
                      updateFilter("type", checked ? type : undefined)
                    }
                  />
                  <Label
                    htmlFor={`type-${type}`}
                    className="text-sm capitalize cursor-pointer"
                  >
                    {type.replace("_", " ")}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Genres */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Genres</Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {GENRES.map((genre) => (
                <div key={genre} className="flex items-center space-x-2">
                  <Checkbox
                    id={`genre-${genre}`}
                    checked={filters.genre === genre}
                    onCheckedChange={(checked) =>
                      updateFilter("genre", checked ? genre : undefined)
                    }
                  />
                  <Label
                    htmlFor={`genre-${genre}`}
                    className="text-sm capitalize cursor-pointer"
                  >
                    {genre.replace("-", " ")}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Sort By</Label>
            <select
              value={filters.sort || ""}
              onChange={(e) =>
                updateFilter("sort", e.target.value || undefined)
              }
              className="w-full p-2 border rounded-md text-sm bg-background"
              aria-label="Sort search results by"
            >
              <option value="">Relevance</option>
              <option value="title">Title A-Z</option>
              <option value="-title">Title Z-A</option>
              <option value="release_date">Newest First</option>
              <option value="-release_date">Oldest First</option>
              <option value="rating">Highest Rated</option>
              <option value="-rating">Lowest Rated</option>
              <option value="popularity">Most Popular</option>
              <option value="-popularity">Least Popular</option>
            </select>
          </div>

          {/* Year Range */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Release Year
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="From"
                min="1900"
                max={new Date().getFullYear()}
                value={filters.year_from || ""}
                onChange={(e) =>
                  updateFilter("year_from", e.target.value || undefined)
                }
                className="text-sm"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="number"
                placeholder="To"
                min="1900"
                max={new Date().getFullYear()}
                value={filters.year_to || ""}
                onChange={(e) =>
                  updateFilter("year_to", e.target.value || undefined)
                }
                className="text-sm"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

interface SearchResultsProps {
  query: string;
  className?: string;
  itemsPerPage?: number;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  className,
  itemsPerPage = 20,
}) => {
  const [filters, setFilters] = useState<ContentFilters>(() => ({
    page: 1,
    limit: itemsPerPage,
  }));

  const { search, results, isSearching, error, pagination } =
    useContentSearch();

  // Update search when query or filters change
  useEffect(() => {
    if (query?.trim()) {
      search({
        q: query.trim(),
        ...filters,
      });
    }
  }, [query, filters, search]);

  // Reset to page 1 when query changes
  useEffect(() => {
    if (query) {
      setFilters((prev) => ({ ...prev, page: 1 }));
    }
  }, [query]);

  const handleFiltersChange = useCallback((newFilters: ContentFilters) => {
    setFilters(newFilters);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const resultCount = pagination?.total_items || results.length;
  const hasResults = results.length > 0;
  const showResults = !isSearching && (hasResults || error);

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Search Results</h1>
          {query && (
            <p className="text-muted-foreground mt-1">
              {isSearching ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Searching...
                </span>
              ) : (
                <>
                  Results for <span className="font-medium">"{query}"</span>
                  {resultCount > 0 && (
                    <span className="ml-1">
                      ({resultCount.toLocaleString()} found)
                    </span>
                  )}
                </>
              )}
            </p>
          )}
        </div>

        {query && (
          <SearchFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        )}
      </div>

      {error && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <p className="text-muted-foreground mb-2">
              Something went wrong while searching
            </p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => search({ q: query, ...filters })}
              className="mt-4"
            >
              Try again
            </Button>
          </div>
        </div>
      )}

      {showResults && (
        <ContentGrid
          content={results}
          isLoading={isSearching}
          emptyMessage={
            query
              ? `No results found for "${query}". Try adjusting your search terms or filters.`
              : "Enter a search term to get started"
          }
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};
