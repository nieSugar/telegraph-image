import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/useAuth';
import { isAuthenticated } from '../utils/authUtils';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated: contextAuthenticated } = useAuth();
  const [localStorageAuth, setLocalStorageAuth] = useState(isAuthenticated());
  const location = useLocation();
  
  // 在组件挂载和路由变化时检查本地存储的登录状态
  useEffect(() => {
    setLocalStorageAuth(isAuthenticated());
  }, [location.pathname]);

  // 综合考虑 Context 和 localStorage 的状态
  const authenticated = contextAuthenticated || localStorageAuth;

  // 如果用户未登录，重定向到登录页面
  if (!authenticated) {
    // 记录当前路径，便于登录后重定向回来
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 如果已登录，则展示子组件
  return <>{children}</>;
};

export default ProtectedRoute;
