import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { authApi } from '@client/src/api';
import type { UserInfo } from '@shared/api.interface';

interface AuthContextType {
  user: UserInfo | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    password: string;
    realName: string;
    phone?: string;
    dormBuilding?: string;
    dormRoom?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { user: currentUser } = await authApi.me();
      setUser(currentUser);
    } catch (error) {
      logger.error('刷新用户信息失败', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (username: string, password: string) => {
    const { user: loggedInUser } = await authApi.login({ username, password });
    setUser(loggedInUser);
  }, []);

  const register = useCallback(async (data: {
    username: string;
    password: string;
    realName: string;
    phone?: string;
    dormBuilding?: string;
    dormRoom?: string;
  }) => {
    const { user: registeredUser } = await authApi.register(data);
    setUser(registeredUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      logger.error('登出失败', error);
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
