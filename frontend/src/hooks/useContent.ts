import { useEffect } from 'react';
import { useContentStore } from '@/store/contentStore';
import { useAuth } from './useAuth';

export function useContent() {
  const contentStore = useContentStore();
  const { isAuthenticated } = useAuth();

  // Auto-load featured content on mount
  useEffect(() => {
    contentStore.loadFeaturedContent();
    contentStore.loadTrendingContent();
    contentStore.loadNewReleases();
    contentStore.loadGenres();
    contentStore.loadCategories();
  }, []);

  // Load user-specific content when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      contentStore.loadContinueWatching();
      contentStore.loadRecommendations();
    }
  }, [isAuthenticated]);

  // Helper functions for content interactions
  const toggleWatchlist = async (contentId: string, profileId: string) => {
    const isInWatchlist = contentStore.watchlist.some(item => item.id === contentId);
    
    if (isInWatchlist) {
      await contentStore.removeFromWatchlist(contentId, profileId);
    } else {
      await contentStore.addToWatchlist(contentId, profileId);
    }
  };

  const playContent = async (contentId: string, quality?: string) => {
    try {
      const streamingUrl = await contentStore.startStream(contentId, quality as any);
      return streamingUrl;
    } catch (error) {
      console.error('Failed to start playback:', error);
      throw error;
    }
  };

  const updateProgress = async (contentId: string, progress: number, duration: number) => {
    try {
      await contentStore.updateWatchProgress(contentId, progress, duration);
    } catch (error) {
      console.error('Failed to update watch progress:', error);
    }
  };

  return {
    ...contentStore,
    toggleWatchlist,
    playContent,
    updateProgress,
  };
}

