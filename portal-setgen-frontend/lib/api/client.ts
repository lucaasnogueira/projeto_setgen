import axios from 'axios';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Interceptor para adicionar token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('auth-storage');
        document.cookie = 'auth-storage=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        if (!window.location.pathname.startsWith('/auth/login')) {
          window.location.replace('/auth/login');
        }
      }
    } else if (error.response?.status >= 500) {
      console.error(
        `[API 500 Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`,
        error.response?.data
      );
    }
    return Promise.reject(error);
  }
);

export default api;
