
import { WatchProgress } from '@/types';
import { Content, contentAPI, ContentFilters, SearchParams } from '../lib/api';
import { useApi } from './use-api';
import { useCallback, useState } from 'react';

export const useContent = (filters?: ContentFilters) => {
  const [currentFilters, setCurrentFilters] = useState<ContentFilters>(filters || {});
  
  const contentQuery = useApi(
    () => contentAPI.browseContent(currentFilters),
    {
      enabled: true,
      refetchOnMount: true,
    }
  );

  const updateFilters = useCallback((newFilters: Partial<ContentFilters>) => {
    setCurrentFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setCurrentFilters({});
  }, []);

  return {
    content: contentQuery.data || [],
    ...contentQuery,
    filters: currentFilters,
    updateFilters,
    resetFilters,
    refetch: contentQuery.refetch,
  };
};

export const useContentById = (id: string) => {
  return useApi(
    () => contentAPI.getContentById(id),
    {
      enabled: !!id,
      refetchOnMount: true,
    }
  );
};

export const useContentSearch = () => {
  const [searchResults, setSearchResults] = useState<Content[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const search = useCallback(async (params: SearchParams) => {
    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await contentAPI.searchContent(params);
      if (response.success && response.data) {
        setSearchResults(response.data);
      } else {
        throw new Error(response.message || 'Search failed');
      }
    } catch (error: any) {
      setSearchError(error.message || 'Search failed');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchError(null);
  }, []);

  return {
    results: searchResults,
    isSearching,
    error: searchError,
    search,
    clearSearch,
  };
};

export const useFeaturedContent = () => {
  return useApi(
    () => contentAPI.getFeaturedContent(),
    {
      refetchOnMount: true,
    }
  );
};

export const useTrendingContent = () => {
  return useApi(
    () => contentAPI.getTrendingContent(),
    {
      refetchOnMount: true,
    }
  );
};

export const useNewReleases = () => {
  return useApi(
    () => contentAPI.getNewReleases(),
    {
      refetchOnMount: true,
    }
  );
};

export const useContentActions = () => {
  const [actionStates, setActionStates] = useState<Record<string, boolean>>({});

  const updateActionState = useCallback((action: string, loading: boolean) => {
    setActionStates(prev => ({ ...prev, [action]: loading }));
  }, []);

  const rateContent = useCallback(async (contentId: string, rating: number) => {
    updateActionState(`rate_${contentId}`, true);
    try {
      const response = await contentAPI.rateContent(contentId, { rating });
      return response;
    } finally {
      updateActionState(`rate_${contentId}`, false);
    }
  }, [updateActionState]);

  const addReview = useCallback(async (contentId: string, review: { title: string; comment: string; rating: number }) => {
    updateActionState(`review_${contentId}`, true);
    try {
      const response = await contentAPI.addReview(contentId, review);
      return response;
    } finally {
      updateActionState(`review_${contentId}`, false);
    }
  }, [updateActionState]);

  const updateWatchProgress = useCallback(async (contentId: string, progress: WatchProgress) => {
    try {
      const response = await contentAPI.updateWatchProgress(contentId, progress);
      return response;
    } catch (error) {
      console.error('Failed to update watch progress:', error);
    }
  }, []);

  return {
    rateContent,
    addReview,
    updateWatchProgress,
    isLoading: (action: string) => actionStates[action] || false,
  };
};
