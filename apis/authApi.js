import axios from 'axios';
import useAuthStore from '@/stores/useAuthStore';

const authApi = axios.create({
  baseURL: '', // 또는 '/'
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

authApi.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  const url = config.url ?? '';

  // 인증 관련 API에는 Authorization 붙이지 않음
  const isAuthApi = url.startsWith('/api/auth') || url.startsWith('/api/mail');

  if (!isAuthApi && token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default authApi;
