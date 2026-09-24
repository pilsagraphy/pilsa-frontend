// 구글 연동 API (소셜 로그인 · 계정 연결 · 캘린더 자동 등록)
//
// 연동은 전부 "동의 URL 을 받아서 그 주소로 이동" 하는 방식이다.
// 구글 동의가 끝나면 백엔드 콜백이 처리한 뒤 프론트로 302 로 돌려보낸다:
//   로그인      → /login?login=google         (실패: /login?error=...)
//                 연결된 회원 없음 → /login?googleLink=1 (+HttpOnly 쿠키 g_pending_link 로 구글 계정 10분 보관)
//                 → 로그인 화면이 GET /api/auth/google/pending 으로 내용을 읽어
//                   "이미 가입된 계정 — 연결할까요?"(같은 이메일 회원 있음) / "회원가입할까요?"(없음) 를 묻고,
//                   어느 쪽이든 아이디·비밀번호 로그인이 끝나면 POST /api/user/mypage/google/link 로 붙인다
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

// 연결 대기 상태 (GET /api/auth/google/pending) — 로그인·회원가입 화면이 안내를 가르는 데 쓴다
// [구글로 로그인] 했는데 연결된 회원이 없으면 백엔드가 구글 계정을 10분간 보관(HttpOnly 쿠키 g_pending_link)하고
// /login?googleLink=1 로 돌려보낸다. 쿠키는 프론트가 못 읽으므로 내용은 이걸로 받는다 (읽기만, 소비 아님).
// 응답: { pending:false } | { pending:true, googleEmail, maskedEmail, emailMatched, maskedLoginId }
//   emailMatched=true  → 같은 이메일 회원 있음: "이미 가입된 계정(maskedLoginId)이에요 — 연결할까요?"
//   emailMatched=false → 없음: "회원가입으로 진행할까요?" (googleEmail 로 가입 폼 이메일을 채운다)
export const getGooglePendingLink = async () => {
  const response = await axiosInstance.get('/api/auth/google/pending');
  return response.data;
};

// 연결 대기 취소 (DELETE /api/auth/google/pending) - 204
// 사용자가 [연결하지 않을게요] 를 누른 경우. 남겨 두면 10분 안에 다른 아이디로 로그인할 때 붙어 버린다.
export const discardGooglePendingLink = async () => {
  await axiosInstance.delete('/api/auth/google/pending');
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

// 로그인 화면 경로의 연결 마무리 (POST /api/user/mypage/google/link)
// [구글로 로그인] 했는데 연결된 회원이 없으면 백엔드가 구글 계정을 10분간 보관하고
// /login?googleLink=1 로 돌려보낸다. 그 뒤 아이디·비밀번호로 로그인이 끝나면 이걸 불러 붙인다.
// 보관 토큰은 HttpOnly 쿠키로 브라우저에 묶여 있어 body 로 보낼 게 없다.
// 응답: { message, googleEmail }
export const completeGoogleLink = async () => {
  const response = await axiosInstance.post('/api/user/mypage/google/link');
  return response.data;
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

// 연동 동의 URL (GET /api/user/mypage/calendar/google/authorize?returnTo=/calendar)
// returnTo: 동의가 끝난 뒤 돌아올 프론트 경로. 생략하면 /user/myPage. 같은 사이트 안 경로('/...')만 받는다.
// 캘린더 페이지의 [내 캘린더에 구독]이 그 자리에서 동의를 받고 다시 캘린더로 돌아오는 데 쓴다.
export const getCalendarLinkUrl = async (returnTo) => {
  const response = await axiosInstance.get('/api/user/mypage/calendar/google/authorize', {
    params: returnTo ? { returnTo } : undefined,
  });
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
