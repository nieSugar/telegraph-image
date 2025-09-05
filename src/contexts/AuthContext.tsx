import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContextType';
import { isAuthenticated as checkAuth, saveAuthState } from '../utils/authUtils';

// 上下文提供者组件
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 初始状态直接从 localStorage 获取
  const [isAuthenticated, setIsAuthenticated] = useState(checkAuth());
  const navigate = useNavigate();

  // 添加 localStorage 变化的事件监听
  useEffect(() => {
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
    // 模拟登录验证
    if (username === 'admin' && password === 'password') {
      // 存储登录状态
      saveAuthState(true);
      // 同步更新状态
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  // 登出函数
  const logout = () => {
    // 清除登录状态
    saveAuthState(false);
    // 同步更新状态
    setIsAuthenticated(false);
    // 导航到登录页
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
