import { useEffect } from 'react';
import { useContentStore } from '@/store/contentStore';

export const useContent = () => {
  const {
    featuredContent,
    trendingContent,
    newReleases,
    originals,
    genres,
    currentContent,
    relatedContent,
    searchResults,
    isLoading,
    error,
    fetchFeaturedContent,
    fetchTrendingContent,
    fetchNewReleases,
    fetchOriginals,
    fetchGenres,
    fetchContentById,
    searchContent,
    clearSearch,
    clearError,
  } = useContentStore();

  const loadHomeContent = async () => {
    await Promise.all([
      fetchFeaturedContent(),
      fetchTrendingContent(),
      fetchNewReleases(),
      fetchOriginals(),
      fetchGenres(),
    ]);
  };

  return {
    featuredContent,
    trendingContent,
    newReleases,
    originals,
    genres,
    currentContent,
    relatedContent,
    searchResults,
    isLoading,
    error,
    loadHomeContent,
    fetchContentById,
    searchContent,
    clearSearch,
    clearError,
  };
};
