import { useState, useEffect, useCallback } from 'react';
import { contentService, ContentItem, ContentSearchParams } from '../services/content';

export interface UseContentReturn {
  content: ContentItem[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
  fetchContent: (params?: ContentSearchParams) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useContent = (initialParams: ContentSearchParams = {}): UseContentReturn => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [searchParams, setSearchParams] = useState<ContentSearchParams>(initialParams);

  const fetchContent = useCallback(async (params: ContentSearchParams = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const newParams = { ...searchParams, ...params };
      setSearchParams(newParams);
      
      const response = await contentService.getContent(newParams);
      
      if (newParams.page === 1) {
        setContent(response.data);
      } else {
        setContent(prev => [...prev, ...response.data]);
      }
      
      if (response.pagination) {
        setPagination({
          page: response.pagination.page,
          totalPages: response.pagination.totalPages,
          total: response.pagination.total,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch content');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  const loadMore = useCallback(async () => {
    if (pagination.page < pagination.totalPages && !loading) {
      await fetchContent({ ...searchParams, page: pagination.page + 1 });
    }
  }, [fetchContent, pagination, searchParams, loading]);

  const refresh = useCallback(async () => {
    await fetchContent({ ...searchParams, page: 1 });
  }, [fetchContent, searchParams]);

  useEffect(() => {
    fetchContent(initialParams);
  }, []);

  return {
    content,
    loading,
    error,
    pagination,
    fetchContent,
    loadMore,
    refresh,
  };
};

// Hook for featured content
export const useFeaturedContent = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        setError(null);
        const featured = await contentService.getFeaturedContent();
        setContent(featured);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch featured content');
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  return { content, loading, error };
};

// Hook for trending content
export const useTrendingContent = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        setError(null);
        const trending = await contentService.getTrendingContent();
        setContent(trending);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch trending content');
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  return { content, loading, error };
};

// Hook for continue watching
export const useContinueWatching = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const continueWatching = await contentService.getContinueWatching();
      setContent(continueWatching);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch continue watching');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { content, loading, error, refresh };
};

// Hook for watchlist
export const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWatchlist = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const watchlistItems = await contentService.getWatchlist();
      setWatchlist(watchlistItems.map(item => item.content));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch watchlist');
    } finally {
      setLoading(false);
    }
  }, []);

  const addToWatchlist = useCallback(async (contentId: string) => {
    try {
      await contentService.addToWatchlist(contentId);
      await fetchWatchlist(); // Refresh the list
    } catch (err: any) {
      throw new Error(err.message || 'Failed to add to watchlist');
    }
  }, [fetchWatchlist]);

  const removeFromWatchlist = useCallback(async (contentId: string) => {
    try {
      await contentService.removeFromWatchlist(contentId);
      setWatchlist(prev => prev.filter(item => item.id !== contentId));
    } catch (err: any) {
      throw new Error(err.message || 'Failed to remove from watchlist');
    }
  }, []);

  const isInWatchlist = useCallback((contentId: string) => {
    return watchlist.some(item => item.id === contentId);
  }, [watchlist]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  return {
    watchlist,
    loading,
    error,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    refresh: fetchWatchlist,
  };
};

// Hook for content search with debouncing
export const useContentSearch = (debounceMs = 300) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { content, fetchContent, loading: searchLoading } = useContent();

  // Debounced search effect
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch suggestions
        const suggestionsData = await contentService.getSearchSuggestions(query);
        setSuggestions(suggestionsData);
        
        // Fetch search results
        await fetchContent({ query, page: 1 });
      } catch (err: any) {
        setError(err.message || 'Search failed');
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, debounceMs, fetchContent]);

  const search = useCallback(async (searchQuery: string, params: ContentSearchParams = {}) => {
    setQuery(searchQuery);
    if (searchQuery.trim()) {
      await fetchContent({ ...params, query: searchQuery, page: 1 });
    }
  }, [fetchContent]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    content,
    loading: loading || searchLoading,
    error,
    search,
    clearSearch,
  };
};

export default useContent;