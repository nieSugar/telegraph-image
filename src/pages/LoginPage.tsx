import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '../contexts/useAuth';
import { isAuthenticated } from '../utils/authUtils';
import { IconLock, IconUser, IconArrowRight, IconHome } from '../components/Icons';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated: authContextAuthenticated } = useAuth();

  const returnUrl = (router.query.returnUrl as string) || '/admin';

  useEffect(() => {
    if (authContextAuthenticated || isAuthenticated()) {
      router.replace('/admin');
    }
  }, [router, authContextAuthenticated]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!username.trim()) { setError('请输入用户名'); return; }
      if (!password.trim()) { setError('请输入密码'); return; }

      setIsLoading(true);
      setError('');

      try {
        const success = await login(username.trim(), password);
        if (success) {
          router.replace(returnUrl);
        } else {
          setError('用户名或密码错误');
        }
      } catch {
        setError('登录过程中出现错误，请重试');
      } finally {
        setIsLoading(false);
      }
    },
    [username, password, login, router, returnUrl]
  );

  return (
    <>
      <Head>
        <title>登录 — Telegraph Image</title>
      </Head>

      <div className="ambient-bg" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>
        <div className="card page-enter" style={{ width: '100%', maxWidth: 400, padding: '48px 40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
            {/* Header */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 'var(--radius-lg)',
                background: 'var(--accent-subtle)',
                border: '1px solid var(--border-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'var(--accent)',
              }}>
                <IconLock size={24} />
              </div>
              <h1 className="text-display" style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2, margin: 0 }}>
                Admin Access
              </h1>
              <p style={{ marginTop: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
                请输入管理员凭据
              </p>
            </div>

            {/* Return URL hint */}
            {returnUrl !== '/admin' && returnUrl !== '/' && (
              <div style={{
                width: '100%',
                padding: '10px 14px',
                background: 'var(--accent-subtle)',
                border: '1px solid var(--border-accent)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                color: 'var(--text-accent)',
                textAlign: 'center',
              }}>
                登录后将返回: {returnUrl}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="error-box" style={{ width: '100%' }}>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="input-group">
                <label className="input-label" htmlFor="username">用户名</label>
                <div className="input-with-icon">
                  <span className="input-icon"><IconUser size={18} /></span>
                  <input
                    id="username"
                    className="input-field"
                    type="text"
                    placeholder="请输入用户名"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(''); }}
                    disabled={isLoading}
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="password">密码</label>
                <div className="input-with-icon">
                  <span className="input-icon"><IconLock size={18} /></span>
                  <input
                    id="password"
                    className="input-field"
                    type="password"
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={isLoading || !username.trim() || !password.trim()}
                  style={{ width: '100%' }}
                >
                  {isLoading ? <span className="spinner spinner-sm" /> : <IconArrowRight size={18} />}
                  {isLoading ? '登录中...' : '登录'}
                </button>

                <Link href="/" style={{ textDecoration: 'none' }}>
                  <button type="button" className="btn btn-ghost" style={{ width: '100%' }}>
                    <IconHome size={16} />
                    返回首页
                  </button>
                </Link>
              </div>
            </form>

            {/* Hint */}
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
              如果忘记了登录凭据，请联系系统管理员
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
