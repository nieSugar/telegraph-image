import type { NextApiRequest, NextApiResponse } from 'next';

type LoginResponseData = {
  success: boolean;
  message?: string;
  user?: {
    username: string;
    role: string;
  };
};

// 从环境变量获取管理员凭据，提供默认值作为后备
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password';

// 简单的速率限制（内存中存储，生产环境应使用 Redis 等）
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15分钟

function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]) : req.socket.remoteAddress;
  return ip || 'unknown';
}

function isRateLimited(ip: string): boolean {
  const attempts = loginAttempts.get(ip);
  if (!attempts) return false;

  const now = Date.now();
  if (now - attempts.lastAttempt > LOCKOUT_TIME) {
    loginAttempts.delete(ip);
    return false;
  }

  return attempts.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const attempts = loginAttempts.get(ip);

  if (!attempts || now - attempts.lastAttempt > LOCKOUT_TIME) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
  } else {
    loginAttempts.set(ip, { count: attempts.count + 1, lastAttempt: now });
  }
}

function clearFailedAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponseData>
) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const clientIP = getClientIP(req);

    // 检查速率限制
    if (isRateLimited(clientIP)) {
      return res.status(429).json({
        success: false,
        message: '登录尝试次数过多，请15分钟后再试'
      });
    }

    // 验证请求体
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        success: false,
        message: '无效的请求格式'
      });
    }

    const { username, password } = req.body;

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    // 验证数据类型
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: '用户名和密码必须是字符串'
      });
    }

    // 验证长度
    if (username.trim().length === 0 || password.length === 0) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    if (username.length > 50 || password.length > 100) {
      return res.status(400).json({
        success: false,
        message: '用户名或密码长度超出限制'
      });
    }

    // 验证凭据
    if (username.trim() === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // 登录成功，清除失败记录
      clearFailedAttempts(clientIP);

      return res.status(200).json({
        success: true,
        user: {
          username: ADMIN_USERNAME,
          role: 'admin'
        }
      });
    }

    // 登录失败，记录失败尝试
    recordFailedAttempt(clientIP);

    return res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    });

  } catch (error) {
    console.error('Login API error:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
}
