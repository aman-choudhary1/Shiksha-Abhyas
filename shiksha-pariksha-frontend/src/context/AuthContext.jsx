import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount — restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('sp_user');
    const token  = localStorage.getItem('sp_token');
    if (stored && token) {
      setUser(JSON.parse(stored));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (identifier, password) => {
    const { data } = await api.post('/auth/login', { identifier, password });
    const { accessToken, user: u } = data.data;

    localStorage.setItem('sp_token', accessToken);
    localStorage.setItem('sp_user',  JSON.stringify(u));
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('sp_token');
    localStorage.removeItem('sp_user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const { data } = await api.post('/auth/refresh');
      const { accessToken } = data.data;
      localStorage.setItem('sp_token', accessToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      return accessToken;
    } catch {
      await logout();
      return null;
    }
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
