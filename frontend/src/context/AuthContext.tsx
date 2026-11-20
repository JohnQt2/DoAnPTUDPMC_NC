import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  api,
  setAccessToken,
  clearAccessToken,
  silentRefreshAccessToken,
  isAccessTokenExpiringSoon,
  getAccessToken,
} from '../lib/api';

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
  hasCompletedOnboarding: boolean | null;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
  refreshSession: () => Promise<boolean>;
  markOnboardingCompleted: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  const checkOnboardingStatus = useCallback(async (userId: number) => {
    const localKey = `hanzi4u_onboarded_${userId}`;
    try {
      const roadmapRes = await api.get<any>('/users/roadmap').catch(() => null);
      if (roadmapRes && roadmapRes.roadmap) {
        localStorage.setItem(localKey, '1');
        setHasCompletedOnboarding(true);
      } else if (localStorage.getItem(localKey) === '1') {
        setHasCompletedOnboarding(true);
      } else {
        setHasCompletedOnboarding(false);
      }
    } catch {
      setHasCompletedOnboarding(localStorage.getItem(localKey) === '1');
    }
  }, []);

  const login = (token: string, userData: User) => {
    setAccessToken(token);
    setUser(userData);
    setHasCompletedOnboarding(null);
    checkOnboardingStatus(userData.userId);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout API failed:', err);
    } finally {
      clearAccessToken(true);
      setUser(null);
      setHasCompletedOnboarding(null);
      window.location.hash = '#/login';
    }
  };

  const updateUser = (partial: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : null));
  };

  const markOnboardingCompleted = useCallback(() => {
    if (user) {
      localStorage.setItem(`hanzi4u_onboarded_${user.userId}`, '1');
    }
    setHasCompletedOnboarding(true);
  }, [user]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const token = await silentRefreshAccessToken({ notifyOnFail: false });
      if (token) {
        const profile = await api.get<any>('/users/me');
        const userObj: User = {
          userId: profile.userId,
          email: profile.email,
          displayName: profile.displayName,
          role: profile.role,
          avatarUrl: profile.avatarUrl,
        };
        setUser(userObj);
        await checkOnboardingStatus(userObj.userId);
        return true;
      }
      return false;
    } catch {
      clearAccessToken(false);
      setUser(null);
      setHasCompletedOnboarding(null);
      return false;
    }
  }, [checkOnboardingStatus]);

  useEffect(() => {
    refreshSession().finally(() => setIsLoading(false));

    const handleUnauthorized = () => {
      setUser(null);
      setHasCompletedOnboarding(null);
    };

    // Wake-up / tab-focus silent refresh: catches laptop sleep or browser timer throttling
    // so users returning mid-lesson or mid-exam stay seamlessly authenticated.
    const handleResumeCheck = () => {
      if (document.visibilityState === 'visible' && getAccessToken() && isAccessTokenExpiringSoon(5 * 60 * 1000)) {
        void silentRefreshAccessToken({ notifyOnFail: true });
      }
    };

    const handleOnline = () => {
      if (getAccessToken() && isAccessTokenExpiringSoon(5 * 60 * 1000)) {
        void silentRefreshAccessToken({ notifyOnFail: true });
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    document.addEventListener('visibilitychange', handleResumeCheck);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      document.removeEventListener('visibilitychange', handleResumeCheck);
      window.removeEventListener('online', handleOnline);
    };
  }, [refreshSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        hasCompletedOnboarding,
        login,
        logout,
        updateUser,
        refreshSession,
        markOnboardingCompleted,
      }}
    >
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
