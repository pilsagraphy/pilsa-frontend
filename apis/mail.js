// 이메일 인증 관련 API 처리 (회원가입 · 아이디찾기 · 비밀번호 초기화 공용)
import axiosInstance from '@/apis/axiosInstance';

// 1. 인증번호 발송 (POST /api/mail/verification-code) - 응답: { message, expireTime }
// expireTime 은 인증번호 만료까지 남은 초
// 실패: 400 이메일 미입력 / 500 발송 실패
export const sendVerifyCode = async (email) => {
  const response = await axiosInstance.post('/api/mail/verification-code', { email });
  return response.data; // expireTime(seconds)
};

// 2. 인증번호 검증 (POST /api/mail/verification-code/verify) - 응답: { message, verified: true }
// 성공 시 서버가 통과 플래그를 저장한다(기본 30분, 1회용) — 회원가입·비밀번호 초기화가 이 플래그를 본다
// 실패: 400 이메일·인증번호 미입력 / 400 인증번호 불일치 또는 만료 (200 + false 가 아니다)
export const verifyEmailCode = async (email, code) => {
  const response = await axiosInstance.post('/api/mail/verification-code/verify', {
    email,
    code,
  });
  return response.data; // { message, verified }
};

// 3. 남은 시간 조회 (GET /api/mail/verification-code/ttl) - 응답: 245 (남은 초, 숫자 단독)
// 타이머 표시용. 객체가 아니라 Long 값이 그대로 내려온다. email 은 선택
export const getVerifyCodeTtl = async (email) => {
  const response = await axiosInstance.get('/api/mail/verification-code/ttl', {
    params: { email },
  });
  return response.data; // seconds
};
