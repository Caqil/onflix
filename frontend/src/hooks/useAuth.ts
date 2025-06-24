import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const router = useRouter();
  const authStore = useAuthStore();

  // Auto-redirect based on auth state
  const redirectIfNotAuthenticated = (redirectTo: string = '/login') => {
    if (!authStore.isAuthenticated) {
      router.push(redirectTo);
      return false;
    }
    return true;
  };

  const redirectIfAuthenticated = (redirectTo: string = '/browse') => {
    if (authStore.isAuthenticated) {
      router.push(redirectTo);
      return false;
    }
    return true;
  };

  // Validate token on mount and periodically
  useEffect(() => {
    if (authStore.isAuthenticated && authStore.tokens?.accessToken) {
      authStore.validateToken().catch(() => {
        // Token validation failed, logout user
        authStore.logout();
      });
    }
  }, []);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (authStore.tokens?.expiresAt) {
      const expiryTime = new Date(authStore.tokens.expiresAt).getTime();
      const currentTime = Date.now();
      const timeUntilExpiry = expiryTime - currentTime;
      
      // Refresh 5 minutes before expiry
      const refreshTime = timeUntilExpiry - (5 * 60 * 1000);
      
      if (refreshTime > 0) {
        const timeoutId = setTimeout(() => {
          authStore.refreshToken().catch(() => {
            authStore.logout();
          });
        }, refreshTime);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [authStore.tokens]);

  return {
    ...authStore,
    redirectIfNotAuthenticated,
    redirectIfAuthenticated,
  };
}

