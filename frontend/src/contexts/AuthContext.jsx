import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/axios';
import { connectSocket, disconnectSocket } from '../lib/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const initUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      setInitialized(true);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      const userData = response.data.data.user;
      setUser(userData);
      connectSocket(token);
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    initUser();
  }, [initUser]);

  const login = useCallback(async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { user: userData, accessToken, refreshToken } = response.data.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
    connectSocket(accessToken);

    return userData;
  }, []);

  const register = useCallback(async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.post('/auth/logout', { refreshToken });
    } catch {}

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    disconnectSocket();
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const isAuthenticated = !!user;
  const hasRole = useCallback((...roles) => {
    return user && roles.includes(user.role_name);
  }, [user]);

  const isAdmin = hasRole('admin', 'super_admin');
  const isModerator = hasRole('moderator', 'admin', 'super_admin');
  const isSuperAdmin = hasRole('super_admin');

  return (
    <AuthContext.Provider value={{
      user, loading, initialized, isAuthenticated,
      login, register, logout, updateUser,
      hasRole, isAdmin, isModerator, isSuperAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
