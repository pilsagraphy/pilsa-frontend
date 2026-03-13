// 로그인, 회원가입, 로그아웃, 아이디/비번 찾기 등 인증 관련 API 처리
import api from '@/apis/axiosInstance';

// 토큰 관련 API
// 1. 액세스 토큰 재발급 (POST /api/auth/token/access/refresh)
export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  const response = await api.post('/api/auth/token/access/refresh', { refreshToken });
  return response.data; // 새로운 accessToken 반환 예상
};

// 2. 리프레시 토큰 검사 (POST /api/auth/token/refresh/validate)
export const validateRefreshToken = (token) => {
  return api.post('/api/auth/token/refresh/validate', { refreshToken: token });
};

// 3. 리프레시 토큰 연장 (POST /api/auth/token/refresh/extend)
export const extendRefreshToken = (token) => {
  return api.post('/api/auth/token/refresh/extend', { refreshToken: token });
};

// 로그인 관련
// 1. 로그인 (POST /api/auth/login)
export const login = async (loginId, password) => {
  const response = await api.post('/api/auth/login', { loginId, password });
  return response.data;
};

// 2. 로그아웃 (POST /api/auth/token/logout)
export const logout = async () => {
  const response = await api.post('/api/auth/token/logout');
  return response.data;
};

// 3. 역할 조회 (GET /api/role) - 로그인 사용자 역할 확인
export const getRole = async () => {
  const response = await api.get('/api/role');
  return response.data;
};
