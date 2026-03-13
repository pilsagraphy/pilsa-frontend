import { create } from 'zustand';
import { login, getRole } from '@/apis/auth';

const useAuthStore = create((set, get) => ({
  accessToken: null,
  isLoggedIn: false,

  user: null,
  role: null, // 'ADMIN' | 'ALUMNI' | 'STUDENTS' | ...
  isLoading: false,
  error: null,

  // 토큰 저장
  setAccessToken: (token) => set({ accessToken: token, isLoggedIn: !!token }),

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
  setRole: (role) => set({ role }),

  // 로그인 액션
  login: async (loginId, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await login(loginId, password);
      if (data.refreshToken) {
        if (typeof window !== 'undefined')
          window.localStorage.setItem('refreshToken', data.refreshToken);
      }
      set({
        user: data.user,
        accessToken: data.accessToken ?? null,
        isLoggedIn: true,
        isLoading: false,
      });
      return data; // 성공 시 컴포넌트에서 후속 처리 가능 (리다이렉트 등)
    } catch (err) {
      set({ error: err.response?.data?.message || '로그인 실패', isLoading: false });
      throw err;
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') window.localStorage.removeItem('refreshToken');
    set({ user: null, accessToken: null, isLoggedIn: false, role: null });
  },
}));

export default useAuthStore;
