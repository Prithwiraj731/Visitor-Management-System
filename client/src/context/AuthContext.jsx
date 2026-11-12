import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      // Clear any legacy tokens previously stored in persistent localStorage
      localStorage.removeItem('vms_access_token');
      localStorage.removeItem('vms_user');
      const saved = sessionStorage.getItem('vms_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = sessionStorage.getItem('vms_access_token');
      if (token) {
        try {
          const { data } = await authService.getMe();
          if (data?.data) {
            setUser(data.data);
            sessionStorage.setItem('vms_user', JSON.stringify(data.data));
          }
        } catch (err) {
          console.error('Session verify failed:', err);
          setUser(null);
          sessionStorage.removeItem('vms_user');
          sessionStorage.removeItem('vms_access_token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const { data } = await authService.login({ email, password });
    if (data?.data) {
      setUser(data.data.user);
      sessionStorage.setItem('vms_access_token', data.data.accessToken);
      sessionStorage.setItem('vms_user', JSON.stringify(data.data.user));
      return data.data.user;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      // ignore
    } finally {
      setUser(null);
      sessionStorage.removeItem('vms_user');
      sessionStorage.removeItem('vms_access_token');
      localStorage.removeItem('vms_user');
      localStorage.removeItem('vms_access_token');
      window.location.href = '/login';
    }
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
