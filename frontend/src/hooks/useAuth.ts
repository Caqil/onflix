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
    refreshToken,
  } = useAuthStore();

  // FIXED: Remove potentially problematic useEffect that could cause loops
  // The auth state is already managed by the store and axios interceptors
  // No need for additional token checking in the hook

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Actions
    login,
    register,
    logout,
    clearError,
    refreshToken,
    
    // Computed properties
    isAdmin: user?.role === 'admin',
    isModerator: user?.role === 'moderator',
    hasActiveSubscription: user?.subscription?.status === 'active',
    isEmailVerified: user?.isEmailVerified || false,
    
    // Utility functions
    getUserName: () => user ? `${user.firstName} ${user.lastName}` : '',
    getUserInitials: () => user ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() : 'U',
    canAccessAdmin: () => user?.role === 'admin' || user?.role === 'moderator',
  };
};