// 네이버·카카오 연동 API (소셜 로그인 · 계정 연결) — 구글(apis/google.js)과 같은 흐름, provider 는 'naver' | 'kakao' (2026-10-11)
//
//   로그인      → /login?login=naver            (실패: /login?error=NAVER_CANCELLED|INVALID_STATE|NAVER_NOT_LINKED|NAVER_LOGIN_FAILED)
//                 연결된 회원 없음 → /login?socialLink=naver (+HttpOnly 쿠키 g_pending_link — 구글과 같은 보관함)
//                 → 로그인 화면이 GET /api/auth/{provider}/pending 으로 내용을 읽고(응답 provider 로 어느 쪽인지 안다),
//                   아이디·비밀번호 로그인이 끝나면 POST /api/user/mypage/social/{provider}/link 로 붙인다
//   계정 연결   → /mypage?naver=linked | already_linked | failed
import axiosInstance from '@/apis/axiosInstance';

// 로그인 동의 URL (GET /api/auth/{provider}/authorize). 키가 아직 없으면 503 { message }
export const getSocialLoginUrl = async (provider) => {
  const response = await axiosInstance.get(`/api/auth/${provider}/authorize`);
  return response.data?.authorizeUrl;
};

// 연결 대기 상태 (GET /api/auth/{provider}/pending) — { pending, provider: 'GOOGLE'|'NAVER'|'KAKAO', googleEmail(=제공자 이메일), maskedEmail, emailMatched, maskedLoginId }
export const getSocialPendingLink = async (provider) => {
  const response = await axiosInstance.get(`/api/auth/${provider}/pending`);
  return response.data;
};

export const discardSocialPendingLink = async (provider) => {
  await axiosInstance.delete(`/api/auth/${provider}/pending`);
};

// ─────────────────────── 계정 연결 (마이페이지) ───────────────────────

// { linked, email, linkedAt, configured } — configured=false 면 서버에 키가 아직 없다
export const getSocialLinkStatus = async (provider) => {
  const response = await axiosInstance.get(`/api/user/mypage/social/${provider}`);
  return response.data;
};

// returnTo(선택): 동의(취소) 뒤 돌아갈 경로('/...'). 없으면 /mypage — 설정 페이지에서는 /mypage/settings 를 넘긴다 (2026-10-13)
export const getSocialLinkUrl = async (provider, returnTo) => {
  const response = await axiosInstance.get(`/api/user/mypage/social/${provider}/authorize`, {
    params: returnTo ? { returnTo } : undefined,
  });
  return response.data?.authorizeUrl;
};

// 로그인 화면 경로의 연결 마무리 — { message, email }
export const completeSocialLink = async (provider) => {
  const response = await axiosInstance.post(`/api/user/mypage/social/${provider}/link`);
  return response.data;
};

export const unlinkSocialAccount = async (provider) => {
  const response = await axiosInstance.delete(`/api/user/mypage/social/${provider}`);
  return response.data;
};

export const SOCIAL_PROVIDERS = [
  { key: 'naver', label: '네이버' },
  { key: 'kakao', label: '카카오' },
];

// 서버 응답의 provider('GOOGLE'|'NAVER'|'KAKAO') → 화면 이름
export const providerLabel = (provider) => {
  const p = String(provider ?? '').toUpperCase();
  if (p === 'NAVER') return '네이버';
  if (p === 'KAKAO') return '카카오';
  return '구글';
};
