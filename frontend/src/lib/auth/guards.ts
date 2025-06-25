import { authManager } from './manager';
import { User } from '@/lib/api/auth';

export interface RouteGuardConfig {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireSubscription?: boolean;
  allowedRoles?: string[];
  redirectTo?: string;
}

export class RouteGuard {
  private static redirectToLogin(redirectTo?: string): void {
    if (typeof window !== 'undefined') {
      const loginUrl = redirectTo || '/login';
      const currentPath = window.location.pathname;
      const redirectUrl = currentPath !== '/' ? `${loginUrl}?redirect=${encodeURIComponent(currentPath)}` : loginUrl;
      window.location.href = redirectUrl;
    }
  }

  private static redirectToUpgrade(): void {
    if (typeof window !== 'undefined') {
      window.location.href = '/profile?tab=subscription';
    }
  }

  private static redirectToForbidden(): void {
    if (typeof window !== 'undefined') {
      window.location.href = '/403';
    }
  }

  public static checkAccess(config: RouteGuardConfig = {}): {
    hasAccess: boolean;
    user: User | null;
    reason?: string;
  } {
    const user = authManager.getUser();
    const isAuthenticated = authManager.isAuthenticated();

    // Check authentication requirement
    if (config.requireAuth && !isAuthenticated) {
      return {
        hasAccess: false,
        user: null,
        reason: 'authentication_required',
      };
    }

    // Check admin requirement
    if (config.requireAdmin && !authManager.isAdmin()) {
      return {
        hasAccess: false,
        user,
        reason: 'admin_required',
      };
    }

    // Check subscription requirement
    if (config.requireSubscription && !authManager.hasActiveSubscription()) {
      return {
        hasAccess: false,
        user,
        reason: 'subscription_required',
      };
    }

    // Check specific roles
    if (config.allowedRoles && config.allowedRoles.length > 0) {
      const hasAllowedRole = user && config.allowedRoles.includes(user.role);
      if (!hasAllowedRole) {
        return {
          hasAccess: false,
          user,
          reason: 'insufficient_role',
        };
      }
    }

    return {
      hasAccess: true,
      user,
    };
  }

  public static async enforceAccess(config: RouteGuardConfig = {}): Promise<boolean> {
    const { hasAccess, reason } = this.checkAccess(config);

    if (!hasAccess) {
      switch (reason) {
        case 'authentication_required':
          this.redirectToLogin(config.redirectTo);
          break;
        case 'subscription_required':
          this.redirectToUpgrade();
          break;
        case 'admin_required':
        case 'insufficient_role':
          this.redirectToForbidden();
          break;
      }
      return false;
    }

    return true;
  }

  // Specific guard functions
  public static requireAuth(redirectTo?: string): boolean {
    return this.checkAccess({ requireAuth: true, redirectTo }).hasAccess;
  }

  public static requireAdmin(): boolean {
    return this.checkAccess({ requireAuth: true, requireAdmin: true }).hasAccess;
  }

  public static requireSubscription(): boolean {
    return this.checkAccess({ requireAuth: true, requireSubscription: true }).hasAccess;
  }

  public static canAccessContent(): boolean {
    return this.checkAccess({ requireAuth: true, requireSubscription: true }).hasAccess;
  }

  public static canAccessAdminPanel(): boolean {
    return this.checkAccess({ requireAuth: true, requireAdmin: true }).hasAccess;
  }
}
