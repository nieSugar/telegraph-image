import type { NextApiRequest, NextApiResponse } from 'next';

type LoginResponseData = {
  success: boolean;
  message?: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // 获取请求中的用户名和密码
  const { username, password } = req.body;

  // 简单的验证逻辑（生产环境中应该使用更安全的方式）
  if (username === 'admin' && password === 'password') {
    // 登录成功
    return res.status(200).json({ success: true });
  }

  // 登录失败
  return res.status(401).json({ success: false, message: '用户名或密码错误' });
}
