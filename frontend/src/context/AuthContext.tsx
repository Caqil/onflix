import React, { createContext, useContext, useReducer, useEffect } from "react";
import { authService } from "../services/auth";
import { STORAGE_KEYS } from "../utils/constants";
import { isTokenExpired } from "../utils/helpers";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
  subscription?: {
    plan: string;
    status: string;
    expiresAt: string;
  };
  preferences?: {
    language: string;
    theme: string;
    notifications: boolean;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: User }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "AUTH_LOGOUT" }
  | { type: "CLEAR_ERROR" }
  | { type: "UPDATE_USER"; payload: Partial<User> };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "AUTH_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case "AUTH_FAILURE":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case "AUTH_LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  loading: boolean; // Alias for isLoading for convenience
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
  refreshToken: () => Promise<void>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

      if (token && !isTokenExpired(token)) {
        try {
          dispatch({ type: "AUTH_START" });
          const user = await authService.getCurrentUser();
          dispatch({ type: "AUTH_SUCCESS", payload: user });
        } catch (error) {
          console.error("Token validation failed:", error);
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          dispatch({ type: "AUTH_FAILURE", payload: "Session expired" });
        }
      } else {
        dispatch({ type: "AUTH_LOGOUT" });
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: "AUTH_START" });
      const response = await authService.login({ email, password });

      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token);
      if (response.refreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
      }

      dispatch({ type: "AUTH_SUCCESS", payload: response.user });
    } catch (error: any) {
      dispatch({
        type: "AUTH_FAILURE",
        payload: error.message || "Login failed",
      });
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      dispatch({ type: "AUTH_START" });
      const response = await authService.register(userData);

      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token);
      if (response.refreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
      }

      dispatch({ type: "AUTH_SUCCESS", payload: response.user });
    } catch (error: any) {
      dispatch({
        type: "AUTH_FAILURE",
        payload: error.message || "Registration failed",
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES);
    dispatch({ type: "AUTH_LOGOUT" });
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      // Convert avatar string to File object if it exists
      let updateData: any = { ...data };
      if (data.avatar && typeof data.avatar === 'string') {
        // Function to convert data URL to File object
        const dataURLtoFile = (dataurl: string, filename: string) => {
          let arr = dataurl.split(','),
            mime = arr[0].match(/:(.*?);/)?.[1],
            bstr = atob(arr[1]),
            n = bstr.length,
            u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          return new File([u8arr], filename, { type: mime });
        }

        updateData.avatar = dataURLtoFile(data.avatar, 'avatar.png');
      }

      const updatedUser = await authService.updateProfile(updateData);
      dispatch({ type: "UPDATE_USER", payload: updatedUser });
    } catch (error: any) {
      dispatch({
        type: "AUTH_FAILURE",
        payload: error.message || "Update failed",
      });
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await authService.refreshToken(refreshToken);
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token);

      if (response.refreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
      }
    } catch (error) {
      logout();
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    ...state,
    loading: state.isLoading, // Add loading as alias for isLoading
    login,
    register,
    logout,
    updateProfile,
    clearError,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
