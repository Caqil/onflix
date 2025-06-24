import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  } = useAuthStore();

  useEffect(() => {
    // Check if user is authenticated on mount
    const token = localStorage.getItem('accessToken');
    if (token && !isAuthenticated) {
      // Verify token with backend or refresh
      // This could be implemented as needed
    }
  }, [isAuthenticated]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    isAdmin: user?.role === 'admin',
    hasActiveSubscription: user?.subscription?.status === 'active',
  };
};