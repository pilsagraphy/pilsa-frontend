// 로그인, 회원가입, 로그아웃, 아이디/비번 찾기 등 인증 관련 API 처리
import axiosInstance from '@/apis/axiosInstance';

// 공통 에러 메시지 추출
export const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (typeof data === 'string') return data;
  if (typeof data?.message === 'string') return data.message;
  return fallback;
};

// 토큰 관련 API
// 1. 액세스 토큰 재발급 (POST /api/auth/token/access/refresh)
export const refreshAccessToken = async () => {
  const response = await axiosInstance.post('/api/auth/token/access/refresh');
  return response.data; // 새로운 accessToken 반환 예상
};

// 2. 리프레시 토큰 검사 (POST /api/auth/token/refresh/validate)
export const validateRefreshToken = (token) => {
  return axiosInstance.post('/api/auth/token/refresh/validate');
};

// 3. 리프레시 토큰 연장 (POST /api/auth/token/refresh/extend)
export const extendRefreshToken = (token) => {
  return axiosInstance.post('/api/auth/token/refresh/extend');
};

// 로그인 관련 API
// 1. 로그인 (POST /api/auth/login)
export const login = async (loginId, password) => {
  const response = await axiosInstance.post('/api/auth/login', { loginId, password });
  return response.data;
};

// 2. 회원가입 (POST /api/auth/register)
export const registerUser = async (payload) => {
  const response = await axiosInstance.post('/api/auth/register', payload);
  return response.data;
};

// 2-1. 아이디 중복 확인 (GET /api/auth/check?loginId=value)
export const checkLoginIdDuplicate = async (loginId) => {
  const response = await axiosInstance.get('/api/auth/check', {
    params: { loginId },
  });
  return response.data;
};

// 2-2. 이메일 중복 확인 (GET /api/auth/check?email=value)
export const checkEmailDuplicate = async (email) => {
  const response = await axiosInstance.get('/api/auth/check', {
    params: { email },
  });
  return response.data;
};

// 3. 로그아웃 (POST /api/auth/token/logout)
export const logout = async () => {
  const response = await axiosInstance.post('/api/auth/token/logout');
  return response.data;
};

// 4. 역할 조회 (GET /api/role) - 로그인 사용자 역할 확인
export const getRole = async () => {
  const response = await axiosInstance.get('/api/role');
  return response.data;
};

// 5. 아이디 찾기
// 5-1. 인증번호 검증 (POST /api/auth/id/verify)
export const verifyFindIdCode = async (email, code) => {
  const response = await axiosInstance.post('/api/auth/id/verify', { email, code });
  return response.data;
};

// 5-2. 아이디 찾기 (GET /api/auth/id/find)
export const findLoginIdByEmail = async (email) => {
  const response = await axiosInstance.get('/api/auth/id/find', {
    params: { email },
  });
  return response.data; // { message, loginId }
};

// 5-3. 이메일 찾기 (아이디로 등록된 이메일 조회)
// TODO: 백엔드 엔드포인트 확정 후 연동 (현재 API 미구현 - 응답 형식 예상: { message, email })
export const findEmailByLoginId = async (loginId) => {
  // const response = await axiosInstance.get('/api/auth/email/find', {
  //   params: { loginId },
  // });
  // return response.data; // { message, email }
  throw new Error('NOT_IMPLEMENTED');
};

// 6. 비밀번호 초기화
// 6-1. 비밀번호 찾기 전 단계 - 인증번호 발송 (GET /api/auth/verification)
export const sendPasswordResetVerification = async (loginId, email) => {
  const response = await axiosInstance.get('/api/auth/verification', {
    params: { loginId, email },
  });
  return response.data;
};

// 6-2. 비밀번호 재설정 (PUT /api/auth/password/reset)
export const resetPassword = async ({ loginId, newPassword }) => {
  const response = await axiosInstance.put('/api/auth/password/reset', { loginId, newPassword });
  return response.data;
};
