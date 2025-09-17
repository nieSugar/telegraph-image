import type { NextApiRequest, NextApiResponse } from 'next';
import { LoginResponseData } from '@/types/api';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // 获取请求中的用户名和密码
  const { username, password } = req.body;

  // 验证输入
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }

  // 从环境变量获取认证信息
  const validUsername = process.env.USER_NAME;
  const validPassword = process.env.PASSWORD;

  if (username === validUsername && password === validPassword) {
    // 登录成功
    return res.status(200).json({ success: true });
  }

  // 登录失败
  return res.status(401).json({ success: false, message: '用户名或密码错误' });
}
