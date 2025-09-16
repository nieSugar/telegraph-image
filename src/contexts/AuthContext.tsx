import React, { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from './AuthContextType';
import {
  isAuthenticated as checkAuth,
  saveAuthState,
  clearAuthState,
  getCurrentUser,
  validateAuthState,
  refreshSession
} from '../utils/authUtils';

// 上下文提供者组件
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // 检查认证状态
  const checkAuthState = useCallback(() => {
    try {
      // 验证认证状态完整性
      if (!validateAuthState()) {
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }

      const authenticated = checkAuth();
      const currentUser = getCurrentUser();

      setIsAuthenticated(authenticated);
      setUser(currentUser || null);

      return authenticated;
    } catch (error) {
      console.error('Auth state check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }
  }, []);

  // 初始化认证状态
  useEffect(() => {
    // 延迟检查以避免 hydration 问题
    const timer = setTimeout(() => {
      checkAuthState();
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [checkAuthState]);

  // 监听 localStorage 变化，在不同标签页之间同步登录状态
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'telegraph_auth') {
        checkAuthState();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuthState]);

  // 定期验证认证状态
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated) {
        checkAuthState();
      }
    }, 5 * 60 * 1000); // 每5分钟检查一次

    return () => clearInterval(interval);
  }, [isAuthenticated, checkAuthState]);

  // 登录函数
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password
        }),
        // 添加超时
        signal: AbortSignal.timeout(10000) // 10秒超时
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Login failed:', response.status, errorData.message);
        return false;
      }

      const data = await response.json();

      if (data.success) {
        // 存储登录状态和用户信息
        saveAuthState(true, data.user);

        // 同步更新状态
        setIsAuthenticated(true);
        setUser(data.user || { username, role: 'admin' });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 登出函数
  const logout = useCallback(() => {
    try {
      // 清除认证状态
      clearAuthState();

      // 同步更新状态
      setIsAuthenticated(false);
      setUser(null);

      // 导航到登录页
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // 即使出错也要清除状态
      setIsAuthenticated(false);
      setUser(null);
    }
  }, [router]);

  // 刷新会话
  const refreshUserSession = useCallback(() => {
    try {
      refreshSession();
      checkAuthState();
    } catch (error) {
      console.error('Session refresh error:', error);
    }
  }, [checkAuthState]);

  // 提供给子组件的值
  const contextValue = {
    isAuthenticated,
    user,
    isLoading,
    login,
    logout,
    refreshSession: refreshUserSession,
    checkAuthState
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
