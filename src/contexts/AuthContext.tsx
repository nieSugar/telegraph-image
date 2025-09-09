import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from './AuthContextType';
import { isAuthenticated as checkAuth, saveAuthState } from '../utils/authUtils';

// 上下文提供者组件
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 初始状态，在客户端时直接从 localStorage 获取
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const router = useRouter();

  // 在客户端渲染时初始化认证状态
  useEffect(() => {
    setIsAuthenticated(checkAuth());
    
    // 添加 localStorage 变化的事件监听
    const handleStorageChange = () => {
      setIsAuthenticated(checkAuth());
    };

    // 监听 storage 事件，在不同标签页之间同步登录状态
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 登录函数
  const login = async (username: string, password: string): Promise<boolean> => {
    // 调用登录API
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // 存储登录状态
        saveAuthState(true);
        // 同步更新状态
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // 登出函数
  const logout = () => {
    // 清除登录状态
    saveAuthState(false);
    // 同步更新状态
    setIsAuthenticated(false);
    // 导航到登录页
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
