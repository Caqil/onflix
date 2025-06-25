import { ContentStatus, ContentType, SortOption } from ".";

export interface Content {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  genres: string[]; // Changed from 'genre' to 'genres' to match backend
  maturity_rating: string; // Added to match backend
  language: string; // Added to match backend  
  country: string; // Added to match backend
  release_date: string;
  poster_url: string;
  backdrop_url?: string;
  rating: number;
  vote_count: number;
  popularity: number;
  duration?: number;
  cast?: string[];
  director?: string;
  producer?: string;
  writer?: string;
  trailer_url?: string;
  imdb_id?: string;
  tmdb_id?: number;
  budget?: number;
  revenue?: number;
  status: ContentStatus;
  featured: boolean;
  trending: boolean;
  seasons?: Season[];
  watch_progress?: WatchProgress;
  user_rating?: number;
  created_at: string;
  updated_at: string;
}

export interface Season {
  season_number: number;
  title?: string;
  description?: string;
  episode_count: number;
  release_date: string;
  poster_url?: string;
  episodes?: Episode[];
}

export interface Episode {
  episode_number: number;
  title: string;
  description: string;
  duration: number; // in minutes
  air_date: string;
  thumbnail_url?: string;
  video_url?: string;
  watch_progress?: WatchProgress;
  rating?: number;
  vote_count?: number;
}

export interface WatchProgress {
  content_id: string;
  progress: number; // seconds
  duration: number; // seconds
  percentage: number; // 0-100
  last_updated: string;
  completed: boolean;
  season_number?: number;
  episode_number?: number;
}

// Content filtering and search
export interface ContentFilters {
  page?: number;
  limit?: number;
  genre?: string;
  type?: ContentType;
  sort?: SortOption;
  order?: 'asc' | 'desc';
  year?: number;
  rating_min?: number;
  rating_max?: number;
  content_rating?: string[];
  language?: string;
  country?: string;
  featured?: boolean;
  trending?: boolean;
}

export interface SearchParams {
  q: string;
  page?: number;
  limit?: number;
  type?: ContentType;
  filters?: ContentFilters;
}

export interface SearchResults {
  results: Content[];
  total_results: number;
  total_pages: number;
  current_page: number;
}

// Content rating and reviews
export interface ContentRating {
  user_id: string;
  content_id: string;
  rating: number; // 1-5
  created_at: string;
}

export interface ContentReview {
  id: string;
  user_id: string;
  content_id: string;
  title: string;
  comment: string;
  rating: number; // 1-5
  helpful_count: number;
  created_at: string;
  updated_at: string;
  user: {
    name: string;
    avatar_url?: string;
  };
}

export interface RatingRequest {
  rating: number; // 1-5
}

export interface ReviewRequest {
  title: string;
  comment: string;
  rating: number; // 1-5
}

export interface WatchProgressRequest {
  progress: number; // seconds watched
  duration: number; // total duration in seconds
}

export interface DownloadRequest {
  quality: string; // "480p", "720p", "1080p", "4k"
}