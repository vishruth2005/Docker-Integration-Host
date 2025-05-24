// src/utils/auth.js
export const setTokens = ({ access, refresh }) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  };
  
  export const getAccessToken = () => localStorage.getItem('access_token');
  
  export const isAuthenticated = () => !!getAccessToken();
  
  export const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };
  