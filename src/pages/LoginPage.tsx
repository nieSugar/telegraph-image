import React, { useState } from 'react';
import { Box, Form, FormField, TextInput, Button, Heading, Text, Card } from 'grommet';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [formValues, setFormValues] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: { value: typeof formValues }) => {
    setIsLoading(true);
    setError('');
    
    try {
      
      // 临时实现：用户名为admin，密码为password则登录成功
      if (event.value.username === 'admin' && event.value.password === 'password') {
        // 存储登录状态
        localStorage.setItem('isLoggedIn', 'true');
        // 重定向到管理页面
        navigate('/admin');
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
    <Box fill align="center" justify="center" pad="medium">
      <Card width="medium" pad="medium">
        <Box align="center" gap="medium">
          <Heading level={2}>登录</Heading>
          
          {error && (
            <Text color="status-critical">{error}</Text>
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
