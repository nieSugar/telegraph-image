import { createContext } from 'react';

// 定义上下文类型
export interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// 创建上下文
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
