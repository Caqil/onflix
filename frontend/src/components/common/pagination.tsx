"use client";
import React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { PaginationMeta } from "../../types";
import { cn } from "@/lib/utils/helpers";

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  showSizeChanger?: boolean;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  pagination,
  onPageChange,
  onLimitChange,
  showSizeChanger = true,
  className,
}) => {
  const {
    current_page,
    total_pages,
    total_items,
    items_per_page,
    has_next,
    has_previous,
  } = pagination;

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 7;

    if (total_pages <= maxVisiblePages) {
      for (let i = 1; i <= total_pages; i++) {
        pages.push(i);
      }
    } else {
      const leftSide = Math.floor(maxVisiblePages / 2);
      const rightSide = maxVisiblePages - leftSide - 1;

      if (current_page <= leftSide) {
        for (let i = 1; i <= maxVisiblePages - 1; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(total_pages);
      } else if (current_page > total_pages - rightSide) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = total_pages - maxVisiblePages + 2; i <= total_pages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (
          let i = current_page - leftSide + 1;
          i <= current_page + rightSide - 1;
          i++
        ) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(total_pages);
      }
    }

    return pages;
  };

  const startItem = (current_page - 1) * items_per_page + 1;
  const endItem = Math.min(current_page * items_per_page, total_items);

  if (total_pages <= 1) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between space-y-2 sm:space-y-0",
        className
      )}
    >
      {/* Items info */}
      <div className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {total_items} results
      </div>

      {/* Pagination controls */}
      <div className="flex items-center space-x-2">
        {/* Items per page selector */}
        {showSizeChanger && onLimitChange && (
          <div className="flex items-center space-x-2">
            <span className="text-sm">Show</span>
            <Select
              value={items_per_page.toString()}
              onValueChange={(value) => onLimitChange(parseInt(value))}
            >
              <SelectTrigger className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Page navigation */}
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(current_page - 1)}
            disabled={!has_previous}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {/* Page numbers */}
          <div className="hidden sm:flex items-center space-x-1">
            {generatePageNumbers().map((page, index) => (
              <React.Fragment key={index}>
                {page === "ellipsis" ? (
                  <Button variant="ghost" size="sm" disabled>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant={page === current_page ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onPageChange(page as number)}
                  >
                    {page}
                  </Button>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Mobile page indicator */}
          <div className="sm:hidden flex items-center text-sm">
            Page {current_page} of {total_pages}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(current_page + 1)}
            disabled={!has_next}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
