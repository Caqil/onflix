"use client";

import { useState } from "react";
import { Filter, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useContent } from "@/hooks/useContent";

interface SearchFiltersProps {
  filters: any;
  onFilterChange: (filters: any) => void;
}

export function SearchFilters({ filters, onFilterChange }: SearchFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const { genres } = useContent();

  const handleFilterUpdate = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    onFilterChange({
      query: filters.query,
      genre: "",
      type: "",
      year: undefined,
      rating: undefined,
      sortBy: "popularity",
      sortOrder: "desc",
    });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-4">
      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="text-white border-gray-600 hover:bg-gray-800"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </Button>

        {/* Quick Sort */}
        <div className="flex items-center gap-2">
          <Label className="text-white text-sm">Sort by:</Label>
          <Select
            value={filters.sortBy}
            onValueChange={(value) => handleFilterUpdate("sortBy", value)}
          >
            <SelectTrigger className="w-40 bg-gray-800 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popularity">Popularity</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="release_date">Release Date</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Content Type */}
              <div className="space-y-2">
                <Label className="text-white">Content Type</Label>
                <Select
                  value={filters.type}
                  onValueChange={(value) => handleFilterUpdate("type", value)}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="movie">Movies</SelectItem>
                    <SelectItem value="tv_show">TV Shows</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Genre */}
              <div className="space-y-2">
                <Label className="text-white">Genre</Label>
                <Select
                  value={filters.genre}
                  onValueChange={(value) => handleFilterUpdate("genre", value)}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="All Genres" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Genres</SelectItem>
                    {genres.map((genre) => (
                      <SelectItem key={genre.id} value={genre.slug}>
                        {genre.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Release Year */}
              <div className="space-y-2">
                <Label className="text-white">Release Year</Label>
                <Select
                  value={filters.year?.toString() || ""}
                  onValueChange={(value) =>
                    handleFilterUpdate(
                      "year",
                      value ? parseInt(value) : undefined
                    )
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Any Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any Year</SelectItem>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <Label className="text-white">
                  Minimum Rating: {filters.rating || 0}
                </Label>
                <Slider
                  value={[filters.rating || 0]}
                  onValueChange={(value) =>
                    handleFilterUpdate("rating", value[0])
                  }
                  max={10}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex justify-end mt-6">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="text-white border-gray-600 hover:bg-gray-800"
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
