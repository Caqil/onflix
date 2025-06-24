import { useEffect } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { useAuth } from './useAuth';

export function useAdmin() {
  const adminStore = useAdminStore();
  const { user, isAuthenticated } = useAuth();

  // Check if user has admin access
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const canAccessAdmin = isAuthenticated && isAdmin;

  // Auto-load admin data
  useEffect(() => {
    if (canAccessAdmin) {
      adminStore.loadDashboard();
      adminStore.loadSystemHealth();
    }
  }, [canAccessAdmin]);

  // Helper functions for admin operations
  const createContentWithVideo = async (contentData: any, videoFile: File) => {
    try {
      // Create content first
      const formData = new FormData();
      Object.keys(contentData).forEach(key => {
        formData.append(key, contentData[key]);
      });
      
      await adminStore.createContent(formData);
      
      // If content was created successfully and we have the content ID
      if (adminStore.currentContent?.id && videoFile) {
        const videoFormData = new FormData();
        videoFormData.append('video', videoFile);
        videoFormData.append('quality', '1080p');
        
        await adminStore.uploadVideo(adminStore.currentContent.id, videoFormData);
      }
    } catch (error) {
      console.error('Failed to create content with video:', error);
      throw error;
    }
  };

  const bulkUserAction = async (userIds: string[], action: 'ban' | 'unban' | 'delete', reason?: string) => {
    const promises = userIds.map(userId => {
      switch (action) {
        case 'ban':
          return adminStore.banUser(userId, reason || 'Bulk action');
        case 'unban':
          return adminStore.unbanUser(userId);
        case 'delete':
          return adminStore.deleteUser(userId);
        default:
          return Promise.resolve();
      }
    });

    try {
      await Promise.all(promises);
      // Refresh users list
      await adminStore.loadUsers();
    } catch (error) {
      console.error(`Failed to perform bulk ${action}:`, error);
      throw error;
    }
  };

  const exportAndDownloadReport = async (reportId: string, filename: string) => {
    try {
      const blob = await adminStore.exportReport(reportId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export report:', error);
      throw error;
    }
  };

  return {
    ...adminStore,
    isAdmin,
    canAccessAdmin,
    createContentWithVideo,
    bulkUserAction,
    exportAndDownloadReport,
  };
}
