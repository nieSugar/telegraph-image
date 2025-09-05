import React, { useState, useEffect } from 'react';
import { Box, Form, FormField, TextInput, Button, Heading, Text, Card } from 'grommet';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { isAuthenticated } from '../utils/authUtils';

const LoginPage: React.FC = () => {
  const [formValues, setFormValues] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated: authContextAuthenticated } = useAuth();
  
  // 获取用户原本想要访问的页面路径，如果没有则默认为管理页面
  const from = location.state?.from?.pathname || '/admin';

  // 检查用户是否已经登录，如果已登录则重定向到管理页面
  useEffect(() => {
    // 同时检查 Context 和 localStorage 中的登录状态
    const authenticated = authContextAuthenticated || isAuthenticated();
    if (authenticated) {
      navigate('/admin', { replace: true });
    }
  }, [navigate, authContextAuthenticated]);

  const handleSubmit = async (event: { value: typeof formValues }) => {
    setIsLoading(true);
    setError('');
    
    try {
      // 使用AuthContext中的login函数
      const success = await login(event.value.username, event.value.password);
      
      if (success) {
        // 登录成功，重定向回用户原本想要访问的页面
        navigate(from, { replace: true });
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
          
          {from !== '/admin' && from !== '/' && (
            <Text size="small" color="neutral-4">
              请登录后继续访问: {from}
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
              <Link to="/">返回首页</Link>
            </Box>
          </Form>
        </Box>
      </Card>
    </Box>
  );
};

export default LoginPage;
