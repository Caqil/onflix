import { Content, ContentType } from ".";

export interface Recommendation {
  id: string;
  content: Content;
  reason: RecommendationReason;
  confidence_score: number;
  created_at: string;
  viewed: boolean;
  dismissed: boolean;
}

export interface RecommendationReason {
  type: 'similar_content' | 'genre_preference' | 'trending' | 'new_release' | 'collaborative_filtering' | 'content_based';
  description: string;
  factors: string[];
}

export interface RecommendationFeedback {
  recommendation_id: string;
  feedback: 'like' | 'dislike' | 'not_interested' | 'already_watched';
  reason?: string;
}

export interface PersonalizedFilters {
  exclude_watched?: boolean;
  preferred_genres?: string[];
  min_rating?: number;
  content_type?: ContentType;
  release_year_range?: {
    start: number;
    end: number;
  };
  max_results?: number;
}

export interface SimilarContentRequest {
  content_id: string;
  limit?: number;
  exclude_watched?: boolean;
}

