import { authAPI } from '@/lib/api';
import { authManager, AuthState } from '@/lib/auth/manager';
import { ChangePasswordData, ForgotPasswordData, LoginCredentials, MutationState, RegisterData, ResetPasswordData } from '@/types';
import React, { useState, useEffect, useCallback } from 'react';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>(() => authManager.getAuthState());
  const [loginState, setLoginState] = useState<MutationState>({
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
  });
  const [registerState, setRegisterState] = useState<MutationState>({
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
  });

  // Update auth state when storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setAuthState(authManager.getAuthState());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Setup auto refresh
  useEffect(() => {
    if (authState.isAuthenticated) {
      authManager.setupAutoRefresh();
    }
  }, [authState.isAuthenticated]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setLoginState({ isLoading: true, isSuccess: false, isError: false, error: null });

    try {
      const response = await authAPI.login(credentials);
      
      if (response.success && response.data) {
        authManager.setTokens(response.data);
        setAuthState(authManager.getAuthState());
        setLoginState({ isLoading: false, isSuccess: true, isError: false, error: null });
        return response.data;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      setLoginState({ isLoading: false, isSuccess: false, isError: true, error: errorMessage });
      throw error;
    }
  }, []);

  const register = useCallback(async (userData: RegisterData) => {
    setRegisterState({ isLoading: true, isSuccess: false, isError: false, error: null });

    try {
      const response = await authAPI.register(userData);
      
      if (response.success && response.data) {
        authManager.setTokens(response.data);
        setAuthState(authManager.getAuthState());
        setRegisterState({ isLoading: false, isSuccess: true, isError: false, error: null });
        return response.data;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      setRegisterState({ isLoading: false, isSuccess: false, isError: true, error: errorMessage });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authManager.logout();
    } finally {
      setAuthState(authManager.getAuthState());
    }
  }, []);

  const forgotPassword = useCallback(async (data: ForgotPasswordData) => {
    const response = await authAPI.forgotPassword(data);
    return response;
  }, []);

  const resetPassword = useCallback(async (data: ResetPasswordData) => {
    const response = await authAPI.resetPassword(data);
    return response;
  }, []);

  const verifyEmail = useCallback(async (token: string) => {
    const response = await authAPI.verifyEmail({ token });
    return response;
  }, []);

  const changePassword = useCallback(async (data: ChangePasswordData) => {
    // This would need a change password endpoint in the API
    // For now, return a placeholder
    throw new Error('Change password not implemented yet');
  }, []);

  const refreshAuth = useCallback(async () => {
    const success = await authManager.refreshTokens();
    if (success) {
      setAuthState(authManager.getAuthState());
    }
    return success;
  }, []);

  const checkPermission = useCallback((permission: string): boolean => {
    if (!authState.user) return false;
    
    switch (permission) {
      case 'admin':
        return authManager.isAdmin();
      case 'stream':
        return authManager.canStream();
      case 'download':
        return authManager.canDownload();
      default:
        return authState.isAuthenticated;
    }
  }, [authState.user]);

  const hasRole = useCallback((role: string): boolean => {
    return authManager.hasRole(role);
  }, []);

  const hasActiveSubscription = useCallback((): boolean => {
    return authManager.hasActiveSubscription();
  }, []);

  return {
    // Auth state
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    
    // Mutation states
    login: {
      mutate: login,
      ...loginState,
    },
    register: {
      mutate: register,
      ...registerState,
    },
    
    // Actions
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
    changePassword,
    refreshAuth,
    
    // Permission checks
    checkPermission,
    hasRole,
    hasActiveSubscription,
    isAdmin: authManager.isAdmin(),
    canStream: authManager.canStream(),
    canDownload: authManager.canDownload(),
  };
};
