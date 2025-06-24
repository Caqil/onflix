"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Genre } from '@/lib/types';

interface GenreFilterProps {
  genres: Genre[];
  selectedGenre: string;
  selectedType: string;
}

export function GenreFilter({
  genres,
  selectedGenre,
  selectedType,
}: GenreFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams?.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // Reset to first page when changing filters
    params.delete("page");

    router.push(`/browse?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Content Type Filter */}
      <div className="flex gap-2">
        <Button
          variant={!selectedType ? "default" : "outline"}
          onClick={() => updateFilter("type", "")}
          className={cn(!selectedType && "bg-red-600 hover:bg-red-700")}
        >
          All
        </Button>
        <Button
          variant={selectedType === "movie" ? "default" : "outline"}
          onClick={() => updateFilter("type", "movie")}
          className={cn(
            selectedType === "movie" && "bg-red-600 hover:bg-red-700"
          )}
        >
          Movies
        </Button>
        <Button
          variant={selectedType === "tv_show" ? "default" : "outline"}
          onClick={() => updateFilter("type", "tv_show")}
          className={cn(
            selectedType === "tv_show" && "bg-red-600 hover:bg-red-700"
          )}
        >
          TV Shows
        </Button>
      </div>

      {/* Genre Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={!selectedGenre ? "default" : "outline"}
          onClick={() => updateFilter("genre", "")}
          className={cn(!selectedGenre && "bg-red-600 hover:bg-red-700")}
          size="sm"
        >
          All Genres
        </Button>
        {genres.map((genre) => (
          <Button
            key={genre.id}
            variant={selectedGenre === genre.slug ? "default" : "outline"}
            onClick={() => updateFilter("genre", genre.slug)}
            className={cn(
              selectedGenre === genre.slug && "bg-red-600 hover:bg-red-700"
            )}
            size="sm"
          >
            {genre.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
