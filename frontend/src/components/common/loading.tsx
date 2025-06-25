"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/helpers";

// Basic loading spinner
export const LoadingSpinner: React.FC<{
  className?: string;
  size?: "sm" | "md" | "lg";
}> = ({ className, size = "md" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-primary border-t-transparent",
        sizeClasses[size],
        className
      )}
    />
  );
};

// Full page loading
export const PageLoading: React.FC<{ message?: string }> = ({
  message = "Loading...",
}) => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

// Content card skeleton
const ContentCardSkeleton: React.FC<{ viewMode?: "grid" | "list" }> = ({
  viewMode = "grid",
}) => {
  if (viewMode === "list") {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Poster skeleton */}
            <Skeleton className="w-24 aspect-[2/3] rounded-lg flex-shrink-0" />

            {/* Content info skeleton */}
            <div className="flex-1 space-y-3">
              <div className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>

              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-14" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view skeleton
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[2/3] w-full" />
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
      </CardContent>
    </Card>
  );
};

// Content grid skeleton
export const ContentLoadingSkeleton: React.FC<{
  count?: number;
  viewMode?: "grid" | "list";
  className?: string;
}> = ({ count = 12, viewMode = "grid", className }) => {
  return (
    <div
      className={cn(
        viewMode === "grid"
          ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4"
          : "space-y-4",
        className
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <ContentCardSkeleton key={index} viewMode={viewMode} />
      ))}
    </div>
  );
};

// Table loading skeleton
export const TableLoadingSkeleton: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className }) => {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header skeleton */}
      <div className="flex gap-4 p-4 border-b">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-4 flex-1" />
        ))}
      </div>

      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

// Button loading state
export const ButtonLoading: React.FC<{
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}> = ({ loading = false, children, className, disabled, ...props }) => {
  return (
    <button
      className={cn("flex items-center gap-2", className)}
      disabled={loading || disabled}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  );
};

// Section loading with title
export const SectionLoading: React.FC<{
  title?: string;
  count?: number;
  viewMode?: "grid" | "list";
}> = ({ title, count = 6, viewMode = "grid" }) => {
  return (
    <section className="space-y-4">
      {title && (
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-32" />
        </div>
      )}
      <ContentLoadingSkeleton count={count} viewMode={viewMode} />
    </section>
  );
};

// Featured content loading
export const FeaturedContentLoading: React.FC = () => {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="w-5 h-5" />
        <Skeleton className="h-6 w-40" />
      </div>

      <Card className="relative rounded-xl overflow-hidden">
        <Skeleton className="aspect-[21/9] w-full" />
        <div className="absolute inset-0 p-8 md:p-12 flex items-end">
          <div className="space-y-4 max-w-2xl">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-10 w-96" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-2/3" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
};

// Trending section loading
export const TrendingSectionLoading: React.FC = () => {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="w-5 h-5" />
        <Skeleton className="h-6 w-32" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="aspect-[2/3] w-full rounded-lg" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </section>
  );
};
