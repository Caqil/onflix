"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Filter, Clock } from "lucide-react";
import { useDebounce } from "../../hooks/use-debounce";
import { storage } from "../../lib/utils/helpers";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search movies, TV shows...",
  onSearch,
  className,
}) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  // Get recent searches from storage
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    return storage.get("recent_searches", []);
  });

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Add to recent searches
    const updatedRecent = [
      searchQuery,
      ...recentSearches.filter((item) => item !== searchQuery),
    ].slice(0, 5);

    setRecentSearches(updatedRecent);
    storage.set("recent_searches", updatedRecent);

    // Navigate to search results
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }

    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    storage.remove("recent_searches");
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="pl-9 pr-4"
          />
        </div>
      </form>

      {/* Search Suggestions */}
      {showSuggestions && recentSearches.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Recent Searches</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearRecentSearches}
                className="h-auto p-0 text-xs text-muted-foreground"
              >
                Clear
              </Button>
            </div>
            <div className="space-y-1">
              {recentSearches.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(item)}
                  className="flex items-center w-full p-2 text-left text-sm hover:bg-muted rounded"
                >
                  <Clock className="w-3 h-3 mr-2 text-muted-foreground" />
                  {item}
                </button>
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
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const updateFilter = (key: keyof ContentFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      page: 1,
      limit: filters.limit,
    });
  };

  const activeFiltersCount = Object.keys(filters).filter(
    (key) =>
      key !== "page" && key !== "limit" && filters[key as keyof ContentFilters]
  ).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filters</h4>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
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
                    id={type}
                    checked={filters.type === type}
                    onCheckedChange={(checked) =>
                      updateFilter("type", checked ? type : undefined)
                    }
                  />
                  <Label htmlFor={type} className="text-sm capitalize">
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
                    id={genre}
                    checked={filters.genre === genre}
                    onCheckedChange={(checked) =>
                      updateFilter("genre", checked ? genre : undefined)
                    }
                  />
                  <Label htmlFor={genre} className="text-sm capitalize">
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
              className="w-full p-2 border rounded-md text-sm"
            >
              <option value="">Relevance</option>
              <option value="title">Title</option>
              <option value="release_date">Release Date</option>
              <option value="rating">Rating</option>
              <option value="popularity">Popularity</option>
            </select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

interface SearchResultsProps {
  query: string;
  className?: string;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  className,
}) => {
  const [filters, setFilters] = useState<ContentFilters>({
    page: 1,
    limit: 20,
  });

  const { search, results, isSearching, error } = useContentSearch();

  React.useEffect(() => {
    if (query) {
      search({
        q: query,
        ...filters,
      });
    }
  }, [query, filters, search]);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Search Results</h1>
          {query && (
            <p className="text-muted-foreground">
              {isSearching ? "Searching..." : `Results for "${query}"`}
              {results.length > 0 && ` (${results.length} found)`}
            </p>
          )}
        </div>
        <SearchFilters filters={filters} onFiltersChange={setFilters} />
      </div>

      {error ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{error}</p>
        </div>
      ) : (
        <ContentGrid
          content={results}
          isLoading={isSearching}
          emptyMessage={
            query
              ? `No results found for "${query}"`
              : "Enter a search term to get started"
          }
        />
      )}
    </div>
  );
};
