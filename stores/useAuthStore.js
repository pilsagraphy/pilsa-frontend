import { create } from 'zustand';
import { login, getRole, refreshAccessToken, getErrorMessage } from '@/apis/auth';

// 자동 로그인 사용 여부 (브라우저 재방문 시 세션 복원 시도 여부) — 값은 '1' 하나만 사용
export const AUTO_LOGIN_KEY = 'pilsa:autoLogin';

/**
 * 자동 로그인 표시를 남긴다/지운다.
 *
 * AuthBootstrap 은 공개 경로·게이트에서 이 값이 있을 때만 세션 복원을 시도한다 — 없으면 처음 오는 사람마다
 * 콘솔에 401 이 찍히기 때문이다. 그래서 **세션을 세우는 모든 경로가 이걸 남겨야 한다.**
 * 예전에는 아이디·비밀번호 로그인에만 있어서, 구글로 들어온 사람은 리프레시 쿠키가 살아 있는데도
 * 앱을 껐다 켜면 로그아웃으로 보였다.
 */
export const rememberAutoLogin = (enabled) => {
  try {
    if (enabled) {
      localStorage.setItem(AUTO_LOGIN_KEY, '1');
    } else {
      localStorage.removeItem(AUTO_LOGIN_KEY);
    }
  } catch {
    // localStorage 접근 불가 환경(시크릿 모드 등)에서도 로그인 자체는 성공 처리
  }
};

// 로그인/재발급 응답: { accessToken, userId, memberType, adminLevel, refreshExp }
// GET /api/role 응답:  { memberType, adminLevel }
const useAuthStore = create((set, get) => ({
  accessToken: null,
  isLoggedIn: false,

  user: null, // { userId }
  memberType: null, // 'STUDENT' | 'ALUMNI'
  adminLevel: 0, // 0=일반, 1~3=관리자
  refreshExp: null, // 리프레시 토큰 만료 시각 (epoch ms)
  isLoading: false,
  error: null,
  authChecked: false,

  // 토큰 저장
  setAccessToken: (token) => set({ accessToken: token, isLoggedIn: !!token }),

  // 관리자 여부 (admin_level >= 1)
  isAdmin: () => get().adminLevel >= 1,

  // 인증 응답 공통 반영 (login / refresh / extend)
  applyAuthResponse: (data) =>
    set({
      accessToken: data?.accessToken ?? null,
      isLoggedIn: !!data?.accessToken,
      user: data?.userId ? { userId: data.userId } : null,
      memberType: data?.memberType ?? null,
      adminLevel: data?.adminLevel ?? 0,
      refreshExp: data?.refreshExp ?? null,
      authChecked: true,
    }),

  // 권한 조회 (GET /api/role)
  fetchRole: async () => {
    try {
      const data = await getRole();
      set({
        memberType: data?.memberType ?? null,
        adminLevel: data?.adminLevel ?? 0,
      });
      return data;
    } catch {
      set({ memberType: null, adminLevel: 0 });
      return null;
    }
  },

  // 로그인 액션 (autoLogin: 자동 로그인)
  login: async (loginId, password, autoLogin = false) => {
    set({ isLoading: true, error: null });
    try {
      const data = await login(loginId, password, autoLogin);

      get().applyAuthResponse(data);
      set({ isLoading: false });

      // 자동 로그인 선택 시에만 표시를 남긴다 → AuthBootstrap 이 공개 경로에서도 세션 복원 시도
      rememberAutoLogin(autoLogin);

      return data; // 성공 시 컴포넌트에서 후속 처리 가능 (리다이렉트 등)
    } catch (err) {
      set({
        error: getErrorMessage(err, '로그인 실패'),
        isLoading: false,
      });
      throw err;
    }
  },

  logout: () => {
    rememberAutoLogin(false);
    set({
      user: null,
      accessToken: null,
      isLoggedIn: false,
      memberType: null,
      adminLevel: 0,
      refreshExp: null,
      authChecked: true,
    });
  },

  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      const data = await refreshAccessToken();
      get().applyAuthResponse(data);
      set({ isLoading: false });
    } catch {
      set({
        accessToken: null,
        isLoggedIn: false,
        user: null,
        memberType: null,
        adminLevel: 0,
        refreshExp: null,
        isLoading: false,
        authChecked: true,
      });
    }
  },
}));

export default useAuthStore;
