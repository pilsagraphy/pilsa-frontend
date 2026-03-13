// 로그인, 회원가입, 로그아웃, 아이디/비번 찾기 등 인증 관련 API 처리
import authApi from '@/apis/authApi';

// 토큰 관련 API
// 1. 액세스 토큰 재발급 (POST /api/auth/token/access/refresh)
export const refreshAccessToken = async () => {
  const response = await authApi.post('/api/auth/token/access/refresh');
  return response.data; // 새로운 accessToken 반환 예상
};

// 2. 리프레시 토큰 검사 (POST /api/auth/token/refresh/validate)
export const validateRefreshToken = (token) => {
  return authApi.post('/api/auth/token/refresh/validate');
};

// 3. 리프레시 토큰 연장 (POST /api/auth/token/refresh/extend)
export const extendRefreshToken = (token) => {
  return authApi.post('/api/auth/token/refresh/extend');
};

// 로그인 관련
// 1. 로그인 (POST /api/auth/login)
export const login = async (loginId, password) => {
  const response = await authApi.post('/api/auth/login', { loginId, password });
  return response.data;
};

// 2. 로그아웃 (POST /api/auth/token/logout)
export const logout = async () => {
  const response = await authApi.post('/api/auth/token/logout');
  return response.data;
};

// 3. 역할 조회 (GET /api/role) - 로그인 사용자 역할 확인
export const getRole = async () => {
  const response = await authApi.get('/api/role');
  return response.data;
};
