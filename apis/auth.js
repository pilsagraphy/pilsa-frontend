// 로그인, 회원가입, 로그아웃, 아이디/비번 찾기 등 인증 관련 API 처리

import api from '@/apis/axiosInstance';

// 로그인 (POST /api/auth/login)
export const login = async (userData) => {
  const response = await api.post('/api/auth/login', userData);
  return response.data;
};
