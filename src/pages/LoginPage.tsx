import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Form,
  FormField,
  TextInput,
  Button,
  Heading,
  Text,
  Card,
  Spinner,
  ResponsiveContext
} from 'grommet';
import { Lock, User, Login, Home } from 'grommet-icons';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../contexts/useAuth';
import { isAuthenticated } from '../utils/authUtils';

const LoginPage: React.FC = () => {
  const [formValues, setFormValues] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated: authContextAuthenticated } = useAuth();

  // 获取用户原本想要访问的页面路径，如果没有则默认为管理页面
  const returnUrl = router.query.returnUrl as string || '/admin';

  // 检查用户是否已经登录，如果已登录则重定向到管理页面
  useEffect(() => {
    const authenticated = authContextAuthenticated || isAuthenticated();
    if (authenticated) {
      router.replace('/admin');
    }
  }, [router, authContextAuthenticated]);

  const handleSubmit = useCallback(async (event: { value: typeof formValues }) => {
    // 基本验证
    if (!event.value.username.trim()) {
      setError('请输入用户名');
      return;
    }

    if (!event.value.password.trim()) {
      setError('请输入密码');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const success = await login(event.value.username.trim(), event.value.password);

      if (success) {
        router.replace(returnUrl);
      } else {
        setError('用户名或密码错误');
      }
    } catch (err) {
      setError('登录过程中出现错误，请重试');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [login, router, returnUrl]);

  const handleInputChange = useCallback((nextValue: typeof formValues) => {
    setFormValues(nextValue);
    if (error) {
      setError(''); // 清除错误信息当用户开始输入时
    }
  }, [error]);

  return (
    <ResponsiveContext.Consumer>
      {size => (
        <Box
          fill
          align="center"
          justify="center"
          pad={size === 'small' ? 'medium' : 'large'}
          background={{
            image: "url(https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80)",
            size: "cover",
            position: "center"
          }}
          style={{
            minHeight: '100vh',
            position: 'relative'
          }}
        >
          {/* 背景遮罩 */}
          <Box
            fill
            background="rgba(0, 0, 0, 0.7)"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 0
            }}
          />

          {/* 登录卡片 */}
          <Card
            width={size === 'small' ? '100%' : 'medium'}
            pad={size === 'small' ? 'medium' : 'large'}
            className="custom-card"
            elevation="large"
            round="large"
            style={{ zIndex: 1, position: 'relative' }}
          >
            <Box align="center" gap="medium">
              {/* 标题区域 */}
              <Box align="center" gap="small">
                <Lock size="large" color="brand" />
                <Heading level={2} margin="none" textAlign="center">
                  管理员登录
                </Heading>
                <Text textAlign="center" color="neutral-4" size="small">
                  请输入管理员凭据以访问后台
                </Text>
              </Box>

              {/* 错误信息 */}
              {error && (
                <Box
                  pad="small"
                  background="status-critical"
                  round="small"
                  width="100%"
                >
                  <Text color="white" textAlign="center" size="small">
                    {error}
                  </Text>
                </Box>
              )}

              {/* 返回提示 */}
              {returnUrl !== '/admin' && returnUrl !== '/' && (
                <Box
                  pad="small"
                  background="rgba(124, 77, 255, 0.1)"
                  round="small"
                  width="100%"
                >
                  <Text size="small" color="brand" textAlign="center">
                    登录后将返回: {returnUrl}
                  </Text>
                </Box>
              )}

              {/* 登录表单 */}
              <Form
                value={formValues}
                onChange={handleInputChange}
                onSubmit={handleSubmit}
                style={{ width: '100%' }}
              >
                <Box gap="medium">
                  <FormField
                    name="username"
                    label="用户名"
                    required
                  >
                    <TextInput
                      name="username"
                      placeholder="请输入用户名"
                      icon={<User />}
                      disabled={isLoading}
                    />
                  </FormField>

                  <FormField
                    name="password"
                    label="密码"
                    required
                  >
                    <TextInput
                      name="password"
                      type="password"
                      placeholder="请输入密码"
                      icon={<Lock />}
                      disabled={isLoading}
                    />
                  </FormField>

                  {/* 操作按钮 */}
                  <Box gap="small" margin={{ top: 'medium' }}>
                    <Button
                      type="submit"
                      primary
                      label={isLoading ? "登录中..." : "登录"}
                      disabled={isLoading || !formValues.username.trim() || !formValues.password.trim()}
                      icon={isLoading ? <Spinner size="small" /> : <Login />}
                      className="custom-button"
                      fill
                    />

                    <Link href="/" passHref>
                      <Button
                        label="返回首页"
                        icon={<Home />}
                        disabled={isLoading}
                        className="custom-button"
                        fill
                      />
                    </Link>
                  </Box>
                </Box>
              </Form>

              {/* 提示信息 */}
              <Box align="center" margin={{ top: 'small' }}>
                <Text size="xsmall" color="neutral-4" textAlign="center">
                  如果您忘记了登录凭据，请联系系统管理员
                </Text>
              </Box>
            </Box>
          </Card>
        </Box>
      )}
    </ResponsiveContext.Consumer>
  );
};

export default LoginPage;
