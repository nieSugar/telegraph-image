import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContextType';

// 上下文提供者组件
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // 初始化时检查登录状态
  useEffect(() => {
    const status = localStorage.getItem('isLoggedIn') === 'true';
    setIsAuthenticated(status);
  }, []);

  // 登录函数
  const login = async (username: string, password: string): Promise<boolean> => {
    // 模拟登录验证
    if (username === 'admin' && password === 'password') {
      localStorage.setItem('isLoggedIn', 'true');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  // 登出函数
  const logout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
