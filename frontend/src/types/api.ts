
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: PaginationMeta;
}

export interface ApiError {
  success: false;
  message: string;
  error?: string;
  code?: string;
  details?: Record<string, string[]>;
}

export interface PaginationMeta {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
  has_next: boolean;
  has_previous: boolean;
}

// API status for hooks
export type ApiStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ApiState<T = any> {
  data: T | null;
  status: ApiStatus;
  error: string | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

// Request states for mutations
export interface MutationState {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
}