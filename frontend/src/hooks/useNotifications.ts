
import { useUser } from '@/app/Contexts/UserContext';
import { useEffect, useState } from 'react';

export function useNotifications() {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);

  // Calculate unread count
  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  // Helper to get notifications by type
  const getNotificationsByType = (type: string) => {
    return notifications.filter(n => n.type === type);
  };

  // Helper to get recent notifications (last 7 days)
  const getRecentNotifications = () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return notifications.filter(n => 
      new Date(n.created_at) > sevenDaysAgo
    );
  };

  return {
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getNotificationsByType,
    getRecentNotifications,
    hasUnread: unreadCount > 0,
  };
}