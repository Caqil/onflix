import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { authAPI } from './api'
import { User, AuthTokens } from './types'

// Custom JWT token type
interface CustomJWT {
  accessToken?: string
  refreshToken?: string
  accessTokenExpires?: number
  user?: User
  error?: string
}

// Session type with custom user
interface CustomSession {
  user: User
  accessToken: string
  error?: string
}

// Auth configuration for NextAuth.js
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials')
        }

        try {
          const response = await authAPI.login({
            email: credentials.email,
            password: credentials.password,
          })

          const { user, tokens } = response.data.data!

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: user,
          }
        } catch (error: any) {
          console.error('Login error:', error)
          throw new Error(error.response?.data?.message || 'Login failed')
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  
  callbacks: {
    async jwt({ token, user, account }): Promise<CustomJWT> {
      // Initial sign in
      if (account && user) {
        return {
          accessToken: (user as any).accessToken,
          refreshToken: (user as any).refreshToken,
          accessTokenExpires: Date.now() + 60 * 60 * 1000, // 1 hour
          user: (user as any).user,
        }
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires || 0)) {
        return token
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token)
    },

    async session({ session, token }): Promise<CustomSession> {
      if (token.error) {
        return {
          ...session,
          user: token.user as User,
          accessToken: '',
          error: token.error,
        }
      }

      return {
        ...session,
        user: token.user as User,
        accessToken: token.accessToken as string,
      }
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },

  pages: {
    signIn: '/login',
    signUp: '/register',
    error: '/auth/error',
  },

  events: {
    async signOut() {
      // Clean up any stored tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
}

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(token: CustomJWT): Promise<CustomJWT> {
  try {
    if (!token.refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await authAPI.refreshToken(token.refreshToken)
    const refreshedTokens = response.data.data!

    return {
      ...token,
      accessToken: refreshedTokens.accessToken,
      refreshToken: refreshedTokens.refreshToken ?? token.refreshToken,
      accessTokenExpires: Date.now() + 60 * 60 * 1000, // 1 hour
    }
  } catch (error) {
    console.error('Error refreshing access token:', error)
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    }
  }
}

/**
 * Auth utility functions
 */
export class AuthUtils {
  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false
    return !!localStorage.getItem('accessToken')
  }

  /**
   * Get stored access token
   */
  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('accessToken')
  }

  /**
   * Get stored refresh token
   */
  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('refreshToken')
  }

  /**
   * Store authentication tokens
   */
  static setTokens(tokens: AuthTokens): void {
    if (typeof window === 'undefined') return
    localStorage.setItem('accessToken', tokens.accessToken)
    localStorage.setItem('refreshToken', tokens.refreshToken)
  }

  /**
   * Clear all authentication data
   */
  static clearAuth(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }

  /**
   * Get stored user data
   */
  static getStoredUser(): User | null {
    if (typeof window === 'undefined') return null
    const userData = localStorage.getItem('user')
    return userData ? JSON.parse(userData) : null
  }

  /**
   * Store user data
   */
  static setStoredUser(user: User): void {
    if (typeof window === 'undefined') return
    localStorage.setItem('user', JSON.stringify(user))
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return Date.now() >= payload.exp * 1000
    } catch {
      return true
    }
  }

  /**
   * Decode JWT token payload
   */
  static decodeToken(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]))
    } catch {
      return null
    }
  }

  /**
   * Check if user has specific role
   */
  static hasRole(user: User | null, role: string): boolean {
    return user?.role === role
  }

  /**
   * Check if user has admin privileges
   */
  static isAdmin(user: User | null): boolean {
    return this.hasRole(user, 'admin')
  }

  /**
   * Check if user has active subscription
   */
  static hasActiveSubscription(user: User | null): boolean {
    return user?.subscription?.status === 'active'
  }

  /**
   * Get user initials for avatar
   */
  static getUserInitials(user: User | null): string {
    if (!user) return 'U'
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase()
  }

  /**
   * Format user full name
   */
  static getUserFullName(user: User | null): string {
    if (!user) return 'Unknown User'
    return `${user.firstName || ''} ${user.lastName || ''}`.trim()
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Generate secure password
   */
  static generateSecurePassword(length: number = 12): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(),.?":{}|<>'
    let password = ''
    
    // Ensure at least one character from each required category
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
    password += '0123456789'[Math.floor(Math.random() * 10)]
    password += '!@#$%^&*(),.?":{}|<>'[Math.floor(Math.random() * 18)]
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += chars[Math.floor(Math.random() * chars.length)]
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('')
  }

  /**
   * Handle authentication error
   */
  static handleAuthError(error: any): string {
    if (error.response?.status === 401) {
      return 'Invalid credentials. Please check your email and password.'
    }
    
    if (error.response?.status === 403) {
      return 'Access denied. You do not have permission to perform this action.'
    }
    
    if (error.response?.status === 429) {
      return 'Too many login attempts. Please try again later.'
    }
    
    if (error.response?.data?.message) {
      return error.response.data.message
    }
    
    return 'An unexpected error occurred. Please try again.'
  }

  /**
   * Setup axios interceptors for authentication
   */
  static setupAxiosInterceptors(axiosInstance: any): void {
    // Request interceptor
    axiosInstance.interceptors.request.use(
      (config: any) => {
        const token = this.getAccessToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error: any) => Promise.reject(error)
    )

    // Response interceptor
    axiosInstance.interceptors.response.use(
      (response: any) => response,
      async (error: any) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = this.getRefreshToken()
            if (!refreshToken) {
              this.clearAuth()
              window.location.href = '/login'
              return Promise.reject(error)
            }

            const response = await authAPI.refreshToken(refreshToken)
            const newTokens = response.data.data!
            
            this.setTokens(newTokens)
            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`
            
            return axiosInstance(originalRequest)
          } catch (refreshError) {
            this.clearAuth()
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }
}

/**
 * Auth hooks and utilities for React components
 */
export const useAuthHelpers = () => {
  return {
    isAuthenticated: AuthUtils.isAuthenticated,
    getAccessToken: AuthUtils.getAccessToken,
    getRefreshToken: AuthUtils.getRefreshToken,
    clearAuth: AuthUtils.clearAuth,
    isTokenExpired: AuthUtils.isTokenExpired,
    hasRole: AuthUtils.hasRole,
    isAdmin: AuthUtils.isAdmin,
    hasActiveSubscription: AuthUtils.hasActiveSubscription,
    getUserInitials: AuthUtils.getUserInitials,
    getUserFullName: AuthUtils.getUserFullName,
    validatePassword: AuthUtils.validatePassword,
    handleAuthError: AuthUtils.handleAuthError,
  }
}

// Export default auth config
export default authOptions