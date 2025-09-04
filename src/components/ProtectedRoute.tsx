import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // 如果用户未登录，重定向到登录页面
  if (!isAuthenticated) {
    // 记录当前路径，便于登录后重定向回来
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 如果已登录，则展示子组件
  return <>{children}</>;
};

export default ProtectedRoute;
