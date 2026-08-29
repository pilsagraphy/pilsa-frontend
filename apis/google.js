// 구글 연동 API (소셜 로그인 · 계정 연결 · 캘린더 자동 등록)
//
// 연동은 전부 "동의 URL 을 받아서 그 주소로 이동" 하는 방식이다.
// 구글 동의가 끝나면 백엔드 콜백이 처리한 뒤 프론트로 302 로 돌려보낸다:
//   로그인      → /login?login=google         (실패: /login?error=...)
//   계정 연결   → /user/myPage?google=linked
//   캘린더 연동 → /user/myPage?calendar=linked (실패: ?calendar=failed | ?calendar=cancelled)
//
// accessToken 을 쿼리로 넘기지 않는다 — 브라우저 히스토리와 리퍼러에 남기 때문이다.
// 로그인 콜백은 refreshToken 쿠키만 심고, 프론트가 재발급 API 로 accessToken 을 받아 간다.
import axiosInstance from '@/apis/axiosInstance';

// ─────────────────────── 소셜 로그인 ───────────────────────

// 구글 로그인 동의 URL (GET /api/auth/google/authorize)
export const getGoogleLoginUrl = async () => {
  const response = await axiosInstance.get('/api/auth/google/authorize');
  return response.data?.authorizeUrl;
};

// ─────────────────────── 계정 연결 ───────────────────────

// 연결 상태 (GET /api/user/mypage/google)
export const getGoogleLinkStatus = async () => {
  const response = await axiosInstance.get('/api/user/mypage/google');
  return response.data;
};

// 연결 동의 URL (GET /api/user/mypage/google/authorize)
export const getGoogleLinkUrl = async () => {
  const response = await axiosInstance.get('/api/user/mypage/google/authorize');
  return response.data?.authorizeUrl;
};

// 연결 해제 (DELETE /api/user/mypage/google)
export const unlinkGoogleAccount = async () => {
  const response = await axiosInstance.delete('/api/user/mypage/google');
  return response.data;
};

// ─────────────────────── 캘린더 연동 ───────────────────────

// 연동 상태 (GET /api/user/mypage/calendar/google)
export const getCalendarLinkStatus = async () => {
  const response = await axiosInstance.get('/api/user/mypage/calendar/google');
  return response.data;
};

// 연동 동의 URL (GET /api/user/mypage/calendar/google/authorize)
export const getCalendarLinkUrl = async () => {
  const response = await axiosInstance.get('/api/user/mypage/calendar/google/authorize');
  return response.data?.authorizeUrl;
};

// 연동 해제 (DELETE /api/user/mypage/calendar/google)
// removeEvents=true 면 넣어둔 일정도 사용자 캘린더에서 지운다
export const unlinkCalendar = async (removeEvents = false) => {
  const response = await axiosInstance.delete('/api/user/mypage/calendar/google', {
    params: { removeEvents },
  });
  return response.data;
};
