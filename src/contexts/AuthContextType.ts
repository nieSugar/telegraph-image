import { createContext } from 'react';

// 用户信息接口
export interface User {
  username: string;
  role: string;
}

// 定义上下文类型
export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshSession: () => void;
  checkAuthState: () => boolean;
}

// 创建上下文
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
