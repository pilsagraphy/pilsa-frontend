import { create } from 'zustand';
import { login, getRole, refreshAccessToken } from '@/apis/auth';

const useAuthStore = create((set, get) => ({
  accessToken: null,
  isLoggedIn: false,

  user: null,
  role: null, // 'ADMIN' | 'ALUMNI' | 'STUDENTS' | ...
  isLoading: false,
  error: null,
  authChecked: false,

  // 토큰 저장
  setAccessToken: (token) => set({ accessToken: token, isLoggedIn: !!token }),

  // 역할 저장
  setRole: (role) => set({ role }),

  // 역할 조회 (/api/role)
  fetchRole: async () => {
    try {
      const data = await getRole();
      const role = data?.role ?? data;
      set({ role });
      return role;
    } catch {
      set({ role: null });
      return null;
    }
  },

  // 로그인 액션
  login: async (loginId, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await login(loginId, password);

      set({
        user: data.userId ? { userId: data.userId } : null,
        accessToken: data.accessToken ?? null,
        isLoggedIn: !!data.accessToken,
        role: data.role ?? null,
        isLoading: false,
        authChecked: true,
      });
      return data; // 성공 시 컴포넌트에서 후속 처리 가능 (리다이렉트 등)
    } catch (err) {
      set({ error: err.response?.data?.message || '로그인 실패', isLoading: false });
      throw err;
    }
  },

  logout: () => {
    set({
      user: null,
      accessToken: null,
      isLoggedIn: false,
      role: null,
      authChecked: true,
    });
  },

  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      const data = await refreshAccessToken();

      set({
        accessToken: data.accessToken ?? null,
        isLoggedIn: !!data.accessToken,
        user: data.userId ? { userId: data.userId } : null,
        role: data.role ?? null,
        isLoading: false,
        authChecked: true,
      });
    } catch {
      set({
        accessToken: null,
        isLoggedIn: false,
        user: null,
        role: null,
        isLoading: false,
        authChecked: true,
      });
    }
  },
}));

export default useAuthStore;
