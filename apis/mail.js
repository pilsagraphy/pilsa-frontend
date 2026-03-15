import authApi from '@/apis/authApi';

// 1. 인증번호 발송 (POST /api/mail/verifycode)
export const sendVerifyCode = async (email) => {
  const response = await authApi.post('/api/mail/verifycode', { email });
  return response.data; // expireTime(seconds)
};

// 2. 인증번호 검증 (POST /api/mail/verifycode/verify)
export const verifyEmailCode = async (email, code) => {
  const response = await authApi.post('/api/mail/verifycode/verify', {
    email,
    code,
  });
  return response.data; // true / false
};

// 3. 남은 시간 조회 (GET /api/mail/verification-code/ttl)
export const getVerifyCodeTtl = async (email) => {
  const response = await authApi.get('/api/mail/verification-code/ttl', {
    params: { email },
  });
  return response.data; // seconds
};
