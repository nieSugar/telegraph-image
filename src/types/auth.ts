// 认证相关类型定义

// 认证上下文类型
export interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// 登录请求数据类型
export interface LoginRequest {
  username: string;
  password: string;
}

// 用户信息类型（如果将来需要扩展）
export interface User {
  id: string;
  username: string;
  role?: 'admin' | 'user';
  createdAt?: string;
  lastLoginAt?: string;
}
