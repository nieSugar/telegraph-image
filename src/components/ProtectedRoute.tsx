import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { Box, Spinner, Text } from 'grommet';
import { useAuth } from '../contexts/useAuth';
import {
  isAuthenticated,
  validateAuthState,
  refreshSession,
  isSessionExpiringSoon,
  getSessionTimeLeft
} from '../utils/authUtils';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  redirectTo = '/login'
}) => {
  const { isAuthenticated: contextAuthenticated } = useAuth();
  const [localStorageAuth, setLocalStorageAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionWarning, setSessionWarning] = useState(false);
  const router = useRouter();

  // 检查认证状态
  const checkAuthState = useCallback(() => {
    // 验证认证状态完整性
    if (!validateAuthState()) {
      setLocalStorageAuth(false);
      return false;
    }

    const authenticated = isAuthenticated();
    setLocalStorageAuth(authenticated);

    // 检查会话是否即将过期
    if (authenticated && isSessionExpiringSoon()) {
      setSessionWarning(true);
    } else {
      setSessionWarning(false);
    }

    return authenticated;
  }, []);

  // 刷新会话
  const handleRefreshSession = useCallback(() => {
    refreshSession();
    setSessionWarning(false);
  }, []);

  // 初始化和路由变化时检查认证状态
  useEffect(() => {
    setIsLoading(true);

    // 延迟检查以避免 hydration 问题
    const timer = setTimeout(() => {
      checkAuthState();
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [checkAuthState]);

  // 监听路由变化
  useEffect(() => {
    const handleRouteChange = () => {
      checkAuthState();
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router, checkAuthState]);

  // 定期检查会话状态
  useEffect(() => {
    const interval = setInterval(() => {
      if (contextAuthenticated || localStorageAuth) {
        checkAuthState();
      }
    }, 60000); // 每分钟检查一次

    return () => clearInterval(interval);
  }, [contextAuthenticated, localStorageAuth, checkAuthState]);

  // 综合考虑 Context 和 localStorage 的状态
  const authenticated = contextAuthenticated || localStorageAuth;

  // 处理重定向
  useEffect(() => {
    if (!isLoading && !authenticated) {
      const currentPath = router.asPath;
      const loginPath = redirectTo;

      // 避免无限重定向
      if (currentPath !== loginPath) {
        router.replace({
          pathname: loginPath,
          query: { returnUrl: currentPath },
        });
      }
    }
  }, [authenticated, isLoading, router, redirectTo]);

  // 加载状态
  if (isLoading) {
    return fallback || (
      <Box fill align="center" justify="center" gap="medium">
        <Spinner size="medium" />
        <Text>验证登录状态...</Text>
      </Box>
    );
  }

  // 未认证状态
  if (!authenticated) {
    return fallback || (
      <Box fill align="center" justify="center">
        <Text>重定向到登录页面...</Text>
      </Box>
    );
  }

  // 会话即将过期警告
  const sessionTimeLeft = getSessionTimeLeft();
  const hoursLeft = Math.floor(sessionTimeLeft / (60 * 60 * 1000));
  const minutesLeft = Math.floor((sessionTimeLeft % (60 * 60 * 1000)) / (60 * 1000));

  return (
    <>
      {sessionWarning && (
        <Box
          background="status-warning"
          pad="small"
          direction="row"
          justify="between"
          align="center"
        >
          <Text size="small" color="white">
            会话将在 {hoursLeft > 0 ? `${hoursLeft}小时` : ''}{minutesLeft}分钟 后过期
          </Text>
          <Box direction="row" gap="small">
            <button
              onClick={handleRefreshSession}
              style={{
                background: 'transparent',
                border: '1px solid white',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              延长会话
            </button>
            <button
              onClick={() => setSessionWarning(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ×
            </button>
          </Box>
        </Box>
      )}
      {children}
    </>
  );
};

export default ProtectedRoute;
