import { useCallback, useState } from 'react';


interface UseApiOptions<T> {
  initialData?: T;
  enabled?: boolean;
  refetchOnMount?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

export const useApi = <T = any>(
  apiCall: () => Promise<{ success: boolean; data?: T; message: string }>,
  options: UseApiOptions<T> = {}
) => {
  const {
    initialData = null,
    enabled = true,
    refetchOnMount = true,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<ApiState<T>>({
    data: initialData,
    status: 'idle',
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
  });

  const updateState = useCallback((newState: Partial<ApiState<T>>) => {
    setState(prev => ({
      ...prev,
      ...newState,
      isLoading: newState.status === 'loading',
      isSuccess: newState.status === 'success',
      isError: newState.status === 'error',
    }));
  }, []);

  const execute = useCallback(async () => {
    updateState({ status: 'loading', error: null });

    try {
      const response = await apiCall();
      
      if (response.success && response.data !== undefined) {
        updateState({ 
          status: 'success', 
          data: response.data, 
          error: null 
        });
        onSuccess?.(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'API call failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      updateState({ 
        status: 'error', 
        error: errorMessage 
      });
      onError?.(errorMessage);
      throw error;
    }
  }, [apiCall, onSuccess, onError, updateState]);

  const reset = useCallback(() => {
    setState({
      data: initialData,
      status: 'idle',
      error: null,
      isLoading: false,
      isSuccess: false,
      isError: false,
    });
  }, [initialData]);

  const refetch = useCallback(() => {
    if (enabled) {
      return execute();
    }
  }, [execute, enabled]);

  // Auto-fetch on mount
  useEffect(() => {
    if (enabled && refetchOnMount) {
      execute();
    }
  }, [enabled, refetchOnMount]); // Removed execute from deps to avoid infinite loops

  return {
    ...state,
    execute,
    refetch,
    reset,
    mutate: execute, // Alias for mutations
  };
};
