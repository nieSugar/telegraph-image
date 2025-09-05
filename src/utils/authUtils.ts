/**
 * 检查用户是否已经登录
 * 通过检查 localStorage 中的登录状态来确定
 */
export const isAuthenticated = (): boolean => {
  return localStorage.getItem('isLoggedIn') === 'true';
};

/**
 * 存储登录状态
 */
export const saveAuthState = (isLoggedIn: boolean): void => {
  if (isLoggedIn) {
    localStorage.setItem('isLoggedIn', 'true');
  } else {
    localStorage.removeItem('isLoggedIn');
  }
};
