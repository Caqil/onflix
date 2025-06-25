import apiClient, { ApiResponse } from './client';
import { Content } from './content';

export interface Recommendation {
  id: string;
  title: string;
  type: 'movie' | 'tv_show';
  poster_url: string;
  rating: number;
  reason: string;
  confidence_score?: number;
  genre: string[];
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
  content_type?: 'movie' | 'tv_show';
  release_year_range?: {
    start: number;
    end: number;
  };
}

export interface SimilarContentRequest {
  content_id: string;
  limit?: number;
  exclude_watched?: boolean;
}

class RecommendationsAPI {
  // Get Personalized Recommendations
  async getRecommendations(filters?: PersonalizedFilters): Promise<ApiResponse<Recommendation[]>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (typeof value === 'object') {
            params.append(key, JSON.stringify(value));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }
    return apiClient.get(`/api/v1/recommendations?${params.toString()}`);
  }

  // Get recommendations based on viewing history
  async getBasedOnHistory(limit = 20): Promise<ApiResponse<Recommendation[]>> {
    return apiClient.get(`/api/v1/recommendations/history?limit=${limit}`);
  }

  // Get recommendations based on similar users
  async getBasedOnSimilarUsers(limit = 20): Promise<ApiResponse<Recommendation[]>> {
    return apiClient.get(`/api/v1/recommendations/similar-users?limit=${limit}`);
  }

  // Get similar content recommendations
  async getSimilarContent(data: SimilarContentRequest): Promise<ApiResponse<Content[]>> {
    return apiClient.post('/api/v1/recommendations/similar', data);
  }

  // Get trending recommendations
  async getTrendingRecommendations(period: 'day' | 'week' | 'month' = 'week'): Promise<ApiResponse<Recommendation[]>> {
    return apiClient.get(`/api/v1/recommendations/trending?period=${period}`);
  }

  // Get genre-based recommendations
  async getByGenre(genre: string, limit = 20): Promise<ApiResponse<Recommendation[]>> {
    return apiClient.get(`/api/v1/recommendations/genre/${genre}?limit=${limit}`);
  }

  // Submit recommendation feedback
  async submitFeedback(feedback: RecommendationFeedback): Promise<ApiResponse> {
    return apiClient.post('/api/v1/recommendations/feedback', feedback);
  }

  // Get recommendation history
  async getRecommendationHistory(page = 1, limit = 20): Promise<ApiResponse<Recommendation[]>> {
    return apiClient.get(`/api/v1/recommendations/history?page=${page}&limit=${limit}`);
  }

  // Refresh recommendations (force new recommendations)
  async refreshRecommendations(): Promise<ApiResponse<Recommendation[]>> {
    return apiClient.post('/api/v1/recommendations/refresh');
  }

  // Get recommendations for specific user (admin only)
  async getUserRecommendations(userId: string): Promise<ApiResponse<Recommendation[]>> {
    return apiClient.get(`/api/v1/admin/recommendations/user/${userId}`);
  }

  // Update recommendation preferences
  async updatePreferences(preferences: PersonalizedFilters): Promise<ApiResponse> {
    return apiClient.put('/api/v1/recommendations/preferences', preferences);
  }

  // Get recommendation preferences
  async getPreferences(): Promise<ApiResponse<PersonalizedFilters>> {
    return apiClient.get('/api/v1/recommendations/preferences');
  }
}

const recommendationsAPI = new RecommendationsAPI();
export default recommendationsAPI;
