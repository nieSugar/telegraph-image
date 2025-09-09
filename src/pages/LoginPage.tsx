import React, { useState, useEffect } from 'react';
import { Box, Form, FormField, TextInput, Button, Heading, Text, Card } from 'grommet';
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
    // 同时检查 Context 和 localStorage 中的登录状态
    const authenticated = authContextAuthenticated || isAuthenticated();
    if (authenticated) {
      router.replace('/admin');
    }
  }, [router, authContextAuthenticated]);

  const handleSubmit = async (event: { value: typeof formValues }) => {
    setIsLoading(true);
    setError('');
    
    try {
      // 使用AuthContext中的login函数
      const success = await login(event.value.username, event.value.password);
      
      if (success) {
        // 登录成功，重定向回用户原本想要访问的页面
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
  };

  return (
    <Box fill align="center" justify="center" pad="medium" background={"url(https://rand-img.kidwen.top?rand=true)"}>
      <Card width="medium" pad="medium">
        <Box align="center" gap="medium">
          <Heading level={2}>登录</Heading>
          
          {error && (
            <Text color="status-critical">{error}</Text>
          )}
          
          {returnUrl !== '/admin' && returnUrl !== '/' && (
            <Text size="small" color="neutral-4">
              请登录后继续访问: {returnUrl}
            </Text>
          )}
          
          <Form
            value={formValues}
            onChange={nextValue => setFormValues(nextValue)}
            onSubmit={handleSubmit}
          >
            <FormField name="username" label="用户名">
              <TextInput name="username" placeholder="请输入用户名" />
            </FormField>
            
            <FormField name="password" label="密码">
              <TextInput name="password" type="password" placeholder="请输入密码" />
            </FormField>
            
            <Box direction="row" gap="medium" margin={{ top: 'medium' }} justify="between">
              <Button type="submit" primary label="登录" disabled={isLoading} />
              <Button 
                as={Link}
                href="/"
                label="返回首页" 
                plain 
              />
            </Box>
          </Form>
        </Box>
      </Card>
    </Box>
  );
};

export default LoginPage;
