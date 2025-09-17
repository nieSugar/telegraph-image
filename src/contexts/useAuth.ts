import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import type { AuthContextType } from '@/types/auth';

// 自定义钩子，方便使用认证上下文
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
