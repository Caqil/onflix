"use client";
import React from "react";
import { Loader2 } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { cn } from "../../lib/utils/helpers";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className,
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <Loader2 className={cn("animate-spin", sizeClasses[size], className)} />
  );
};

interface PageLoadingProps {
  message?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({
  message = "Loading...",
}) => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

interface ContentLoadingSkeletonProps {
  count?: number;
  className?: string;
}

export const ContentLoadingSkeleton: React.FC<ContentLoadingSkeletonProps> = ({
  count = 10,
  className,
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="w-full h-72 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <div className="flex gap-1">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

interface TableLoadingSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableLoadingSkeleton: React.FC<TableLoadingSkeletonProps> = ({
  rows = 5,
  columns = 6,
}) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

interface ButtonLoadingProps {
  children: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  className?: string;
  [key: string]: any;
}

export const ButtonLoading: React.FC<ButtonLoadingProps> = ({
  children,
  isLoading = false,
  loadingText,
  className,
  ...props
}) => {
  return (
    <button
      className={cn("relative", className)}
      disabled={isLoading}
      {...props}
    >
      {isLoading && (
        <LoadingSpinner
          size="sm"
          className="absolute left-3 top-1/2 transform -translate-y-1/2"
        />
      )}
      <span className={cn(isLoading && "ml-6")}>
        {isLoading && loadingText ? loadingText : children}
      </span>
    </button>
  );
};
