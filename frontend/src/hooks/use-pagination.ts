import { debounce } from "@/lib/utils/helpers";
import { PaginationMeta } from "@/types";
import { useCallback, useEffect, useMemo, useState } from "react";

interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export const usePagination = (options: UsePaginationOptions = {}) => {
  const {
    initialPage = 1,
    initialLimit = 20,
    onPageChange,
    onLimitChange,
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialLimit);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    onPageChange?.(page);
  }, [onPageChange]);

  const goToNextPage = useCallback(() => {
    if (paginationMeta?.has_next) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, paginationMeta?.has_next, goToPage]);

  const goToPreviousPage = useCallback(() => {
    if (paginationMeta?.has_previous) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, paginationMeta?.has_previous, goToPage]);

  const goToFirstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const goToLastPage = useCallback(() => {
    if (paginationMeta?.total_pages) {
      goToPage(paginationMeta.total_pages);
    }
  }, [paginationMeta?.total_pages, goToPage]);

  const changeLimit = useCallback((limit: number) => {
    setItemsPerPage(limit);
    setCurrentPage(1); // Reset to first page when changing limit
    onLimitChange?.(limit);
  }, [onLimitChange]);

  const updatePaginationMeta = useCallback((meta: PaginationMeta) => {
    setPaginationMeta(meta);
  }, []);

  const paginationInfo = useMemo(() => {
    if (!paginationMeta) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, paginationMeta.total_items);

    return {
      startItem,
      endItem,
      totalItems: paginationMeta.total_items,
      totalPages: paginationMeta.total_pages,
      currentPage,
      itemsPerPage,
      hasNext: paginationMeta.has_next,
      hasPrevious: paginationMeta.has_previous,
    };
  }, [paginationMeta, currentPage, itemsPerPage]);

  return {
    currentPage,
    itemsPerPage,
    paginationMeta,
    paginationInfo,
    
    // Actions
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    changeLimit,
    updatePaginationMeta,
    
    // State
    canGoNext: paginationMeta?.has_next || false,
    canGoPrevious: paginationMeta?.has_previous || false,
  };
};

export const useInfiniteScroll = <T>(
  loadMore: (page: number) => Promise<{ data: T[]; hasMore: boolean }>,
  options: {
    initialPage?: number;
    threshold?: number;
    enabled?: boolean;
  } = {}
) => {
  const { initialPage = 1, threshold = 100, enabled = true } = options;
  
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMoreItems = useCallback(async () => {
    if (isLoading || !hasMore || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await loadMore(page);
      setItems(prev => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setPage(prev => prev + 1);
    } catch (error: any) {
      setError(error.message || 'Failed to load more items');
    } finally {
      setIsLoading(false);
    }
  }, [loadMore, page, isLoading, hasMore, enabled]);

  const debouncedLoadMore = useMemo(
    () => debounce(loadMoreItems, 100),
    [loadMoreItems]
  );

  const reset = useCallback(() => {
    setItems([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
  }, [initialPage]);

  // Scroll event handler
  const handleScroll = useCallback(() => {
    if (!enabled || isLoading || !hasMore) return;

    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      debouncedLoadMore();
    }
  }, [enabled, isLoading, hasMore, threshold, debouncedLoadMore]);

  // Setup scroll listener
  useEffect(() => {
    if (enabled) {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll, enabled]);

  return {
    items,
    isLoading,
    hasMore,
    error,
    loadMore: loadMoreItems,
    reset,
  };
};
