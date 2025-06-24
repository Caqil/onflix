"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type { NotificationType } from "@/types";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface Theme {
  mode: "light" | "dark" | "system";
  primaryColor: string;
  fontSize: "small" | "medium" | "large";
}

interface AppSettings {
  language: string;
  autoPlayTrailers: boolean;
  showMatureContent: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  subtitlesEnabled: boolean;
  defaultVideoQuality: string;
}

interface AppContextType {
  // Theme
  theme: Theme;
  setTheme: (theme: Partial<Theme>) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;

  // App Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;

  // Loading states
  isPageLoading: boolean;
  setPageLoading: (loading: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultTheme: Theme = {
  mode: "system",
  primaryColor: "#ef4444", // red-500
  fontSize: "medium",
};

const defaultSettings: AppSettings = {
  language: "en",
  autoPlayTrailers: true,
  showMatureContent: false,
  reducedMotion: false,
  highContrast: false,
  subtitlesEnabled: false,
  defaultVideoQuality: "auto",
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isPageLoading, setPageLoading] = useState(false);

  // Load saved theme and settings from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("onflix_theme");
      if (savedTheme) {
        try {
          setThemeState(JSON.parse(savedTheme));
        } catch (error) {
          console.error("Failed to parse saved theme:", error);
        }
      }

      const savedSettings = localStorage.getItem("onflix_settings");
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings));
        } catch (error) {
          console.error("Failed to parse saved settings:", error);
        }
      }
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;

      // Apply dark mode
      if (
        theme.mode === "dark" ||
        (theme.mode === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      ) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }

      // Apply font size
      root.classList.remove("text-sm", "text-base", "text-lg");
      switch (theme.fontSize) {
        case "small":
          root.classList.add("text-sm");
          break;
        case "large":
          root.classList.add("text-lg");
          break;
        default:
          root.classList.add("text-base");
      }
    }
  }, [theme]);

  // Save theme to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("onflix_theme", JSON.stringify(theme));
    }
  }, [theme]);

  // Save settings to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("onflix_settings", JSON.stringify(settings));
    }
  }, [settings]);

  const setTheme = (newTheme: Partial<Theme>) => {
    setThemeState((prev) => ({ ...prev, ...newTheme }));
  };

  const isDarkMode =
    theme.mode === "dark" ||
    (theme.mode === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const toggleTheme = () => {
    setTheme({ mode: isDarkMode ? "light" : "dark" });
  };

  const addNotification = (notification: Omit<Notification, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 5000,
    };

    setNotifications((prev) => [...prev, newNotification]);

    // Auto remove notification after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const value: AppContextType = {
    // Theme
    theme,
    setTheme,
    isDarkMode,
    toggleTheme,

    // Notifications
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,

    // Settings
    settings,
    updateSettings,

    // UI State
    sidebarOpen,
    setSidebarOpen,
    searchOpen,
    setSearchOpen,

    // Loading
    isPageLoading,
    setPageLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
