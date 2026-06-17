import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getSocket } from '../lib/socket';
import api from '../lib/axios';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.data.count);
    } catch {}
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();

      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
    }
  }, [isAuthenticated, fetchUnreadCount]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !isAuthenticated) return;

    const handleNotification = (data) => {
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    socket.on('notification', handleNotification);
    return () => socket.off('notification', handleNotification);
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (id) => {
    await api.put(`/notifications/${id}/read`);
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await api.put('/notifications/read-all');
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider value={{
      unreadCount, notifications, fetchUnreadCount, markAsRead, markAllAsRead,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
