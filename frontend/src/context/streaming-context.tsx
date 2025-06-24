"use client";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type {
  PlayerState,
  VideoQuality,
  SubtitleTrack,
  WatchProgress,
  Content,
} from "@/types";

interface StreamingSession {
  contentId: string;
  content: Content;
  sessionId?: string;
  startedAt: Date;
  lastActiveAt: Date;
}

interface StreamingContextType {
  // Current streaming session
  currentSession: StreamingSession | null;
  setCurrentSession: (session: StreamingSession | null) => void;

  // Player state
  playerState: PlayerState | null;
  setPlayerState: (state: PlayerState | null) => void;

  // Video settings
  preferredQuality: VideoQuality;
  setPreferredQuality: (quality: VideoQuality) => void;

  autoPlayNext: boolean;
  setAutoPlayNext: (autoPlay: boolean) => void;

  subtitlesEnabled: boolean;
  setSubtitlesEnabled: (enabled: boolean) => void;

  selectedSubtitleTrack: SubtitleTrack | null;
  setSelectedSubtitleTrack: (track: SubtitleTrack | null) => void;

  // Watch progress
  watchProgress: Record<string, WatchProgress>;
  updateWatchProgress: (contentId: string, progress: WatchProgress) => void;

  // Recently watched
  recentlyWatched: Content[];
  addToRecentlyWatched: (content: Content) => void;

  // Continue watching
  continueWatching: Array<{ content: Content; progress: WatchProgress }>;
  updateContinueWatching: (content: Content, progress: WatchProgress) => void;
  removeContinueWatching: (contentId: string) => void;

  // Actions
  startStreaming: (content: Content) => void;
  stopStreaming: () => void;
  pauseStreaming: () => void;
  resumeStreaming: () => void;
}

const StreamingContext = createContext<StreamingContextType | undefined>(
  undefined
);

interface StreamingProviderProps {
  children: ReactNode;
}

export const StreamingProvider: React.FC<StreamingProviderProps> = ({
  children,
}) => {
  const [currentSession, setCurrentSession] = useState<StreamingSession | null>(
    null
  );
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [preferredQuality, setPreferredQuality] =
    useState<VideoQuality>("auto");
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [selectedSubtitleTrack, setSelectedSubtitleTrack] =
    useState<SubtitleTrack | null>(null);
  const [watchProgress, setWatchProgress] = useState<
    Record<string, WatchProgress>
  >({});
  const [recentlyWatched, setRecentlyWatched] = useState<Content[]>([]);
  const [continueWatching, setContinueWatching] = useState<
    Array<{ content: Content; progress: WatchProgress }>
  >([]);

  // Load saved preferences
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedQuality = localStorage.getItem(
        "onflix_preferred_quality"
      ) as VideoQuality;
      if (savedQuality) setPreferredQuality(savedQuality);

      const savedAutoPlay = localStorage.getItem("onflix_auto_play_next");
      if (savedAutoPlay) setAutoPlayNext(JSON.parse(savedAutoPlay));

      const savedSubtitles = localStorage.getItem("onflix_subtitles_enabled");
      if (savedSubtitles) setSubtitlesEnabled(JSON.parse(savedSubtitles));

      const savedProgress = localStorage.getItem("onflix_watch_progress");
      if (savedProgress) {
        try {
          setWatchProgress(JSON.parse(savedProgress));
        } catch (error) {
          console.error("Failed to parse watch progress:", error);
        }
      }

      const savedRecent = localStorage.getItem("onflix_recently_watched");
      if (savedRecent) {
        try {
          setRecentlyWatched(JSON.parse(savedRecent));
        } catch (error) {
          console.error("Failed to parse recently watched:", error);
        }
      }

      const savedContinue = localStorage.getItem("onflix_continue_watching");
      if (savedContinue) {
        try {
          setContinueWatching(JSON.parse(savedContinue));
        } catch (error) {
          console.error("Failed to parse continue watching:", error);
        }
      }
    }
  }, []);

  // Save preferences to localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("onflix_preferred_quality", preferredQuality);
    }
  }, [preferredQuality]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "onflix_auto_play_next",
        JSON.stringify(autoPlayNext)
      );
    }
  }, [autoPlayNext]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "onflix_subtitles_enabled",
        JSON.stringify(subtitlesEnabled)
      );
    }
  }, [subtitlesEnabled]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "onflix_watch_progress",
        JSON.stringify(watchProgress)
      );
    }
  }, [watchProgress]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "onflix_recently_watched",
        JSON.stringify(recentlyWatched)
      );
    }
  }, [recentlyWatched]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "onflix_continue_watching",
        JSON.stringify(continueWatching)
      );
    }
  }, [continueWatching]);

  const updateWatchProgress = useCallback(
    (contentId: string, progress: WatchProgress) => {
      setWatchProgress((prev) => ({
        ...prev,
        [contentId]: progress,
      }));
    },
    []
  );

  const addToRecentlyWatched = useCallback((content: Content) => {
    setRecentlyWatched((prev) => {
      const filtered = prev.filter((item) => item.id !== content.id);
      return [content, ...filtered].slice(0, 20); // Keep only last 20 items
    });
  }, []);

  const updateContinueWatching = useCallback(
    (content: Content, progress: WatchProgress) => {
      setContinueWatching((prev) => {
        const filtered = prev.filter((item) => item.content.id !== content.id);

        // Only add to continue watching if progress is between 5% and 90%
        if (progress.percentage >= 5 && progress.percentage < 90) {
          return [{ content, progress }, ...filtered].slice(0, 10); // Keep only 10 items
        }

        return filtered;
      });
    },
    []
  );

  const removeContinueWatching = useCallback((contentId: string) => {
    setContinueWatching((prev) =>
      prev.filter((item) => item.content.id !== contentId)
    );
  }, []);

  const startStreaming = useCallback(
    (content: Content) => {
      const session: StreamingSession = {
        contentId: content.id,
        content,
        startedAt: new Date(),
        lastActiveAt: new Date(),
      };

      setCurrentSession(session);
      addToRecentlyWatched(content);
    },
    [addToRecentlyWatched]
  );

  const stopStreaming = useCallback(() => {
    setCurrentSession(null);
    setPlayerState(null);
    setSelectedSubtitleTrack(null);
  }, []);

  const pauseStreaming = useCallback(() => {
    if (currentSession) {
      setCurrentSession({
        ...currentSession,
        lastActiveAt: new Date(),
      });
    }
  }, [currentSession]);

  const resumeStreaming = useCallback(() => {
    if (currentSession) {
      setCurrentSession({
        ...currentSession,
        lastActiveAt: new Date(),
      });
    }
  }, [currentSession]);

  const value: StreamingContextType = {
    // Current session
    currentSession,
    setCurrentSession,

    // Player state
    playerState,
    setPlayerState,

    // Settings
    preferredQuality,
    setPreferredQuality,
    autoPlayNext,
    setAutoPlayNext,
    subtitlesEnabled,
    setSubtitlesEnabled,
    selectedSubtitleTrack,
    setSelectedSubtitleTrack,

    // Progress
    watchProgress,
    updateWatchProgress,

    // Recently watched
    recentlyWatched,
    addToRecentlyWatched,

    // Continue watching
    continueWatching,
    updateContinueWatching,
    removeContinueWatching,

    // Actions
    startStreaming,
    stopStreaming,
    pauseStreaming,
    resumeStreaming,
  };

  return (
    <StreamingContext.Provider value={value}>
      {children}
    </StreamingContext.Provider>
  );
};

export const useStreamingContext = (): StreamingContextType => {
  const context = useContext(StreamingContext);
  if (context === undefined) {
    throw new Error(
      "useStreamingContext must be used within a StreamingProvider"
    );
  }
  return context;
};
