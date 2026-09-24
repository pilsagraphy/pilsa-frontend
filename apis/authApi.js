import axios from 'axios';
import useAuthStore from '@/stores/useAuthStore';

const authApi = axios.create({
  // 로컬 개발에서는 상대경로로 보내 next.config의 rewrite 프록시를 타게 한다.
  // (same-origin → refresh 쿠키 정상 전송) 배포에서는 기존 baseURL 사용.
  baseURL: process.env.NODE_ENV === 'development' ? '' : process.env.NEXT_PUBLIC_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

authApi.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default authApi;
