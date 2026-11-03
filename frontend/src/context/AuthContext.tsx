import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAccessToken, clearAccessToken } from '../lib/api';

export interface User {
  userId: number;
  email: string;
  displayName: string;
  role: 'STUDENT' | 'CONTENT_EDITOR' | 'ADMIN';
  avatarUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const login = (token: string, userData: User) => {
    setAccessToken(token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout API failed:', err);
    } finally {
      clearAccessToken();
      setUser(null);
      window.location.hash = '#/login';
    }
  };

  const updateUser = (partial: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : null));
  };

  const refreshSession = async (): Promise<boolean> => {
    try {
      const res = await api.post<{ accessToken: string }>('/auth/refresh');
      if (res?.accessToken) {
        setAccessToken(res.accessToken);
        const profile = await api.get<any>('/users/me');
        setUser({
          userId: profile.userId,
          email: profile.email,
          displayName: profile.displayName,
          role: profile.role,
          avatarUrl: profile.avatarUrl,
        });
        return true;
      }
      return false;
    } catch {
      clearAccessToken();
      setUser(null);
      return false;
    }
  };

  useEffect(() => {
    // Attempt silent refresh on initial load
    refreshSession().finally(() => setIsLoading(false));

    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser, refreshSession }}>
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
