import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/useAuth';
import { isAuthenticated } from '../utils/authUtils';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated: contextAuthenticated } = useAuth();
  const [localStorageAuth, setLocalStorageAuth] = useState(false);
  const router = useRouter();
  
  // 在客户端渲染时检查本地存储的登录状态
  useEffect(() => {
    setLocalStorageAuth(isAuthenticated());
    
    // 监听路由变化
    const handleRouteChange = () => {
      setLocalStorageAuth(isAuthenticated());
    };
    
    router.events.on('routeChangeComplete', handleRouteChange);
    
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  // 综合考虑 Context 和 localStorage 的状态
  const authenticated = contextAuthenticated || localStorageAuth;

  // 如果用户未登录，重定向到登录页面
  useEffect(() => {
    if (!authenticated) {
      router.push({
        pathname: '/login',
        query: { returnUrl: router.asPath },
      });
    }
  }, [authenticated, router]);

  // 如果未验证，返回 null 不渲染任何内容
  if (!authenticated) {
    return null;
  }

  // 如果已登录，则展示子组件
  return <>{children}</>;
};

export default ProtectedRoute;
