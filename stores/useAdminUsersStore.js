import { create } from 'zustand';

import { getErrorMessage } from '@/apis/auth';
import {
  getUsers,
  updateUser,
  suspendUser,
  banUsers,
  withdrawUser,
} from '@/apis/admin/users';

// 관리자 회원 관리 화면의 통신 상태 스토어
// isLoading / data / error 세 개를 세트로 관리한다.
// - 요청 시작:      { isLoading: true, error: null }
// - 성공/실패 무관: 반드시 isLoading: false 로 되돌린다
// - error 는 사용자에게 그대로 보여줄 한국어 문장
// data 는 회원 목록 응답(fetchUsers)만 채운다.
// 수정/정지/차단/탈퇴는 목록을 덮어쓰지 않고 응답만 반환하므로, 성공 후 fetchUsers 로 다시 그린다.
const useAdminUsersStore = create((set) => ({
  isLoading: false,
  data: null, // { totalPages, totalCount, members: [...] }
  error: null,

  // 1. 회원 목록 조회 (GET /api/admin/users)
  fetchUsers: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const data = await getUsers(params);
      set({ data, isLoading: false });
      return data;
    } catch (err) {
      set({ error: getErrorMessage(err, '회원 목록을 불러오지 못했습니다.'), isLoading: false });
      throw err;
    }
  },

  // 2. 회원 정보 수정 (PATCH /api/admin/users/{userId})
  updateUser: async (userId, payload) => {
    set({ isLoading: true, error: null });
    try {
      const data = await updateUser(userId, payload);
      set({ isLoading: false });
      return data;
    } catch (err) {
      set({ error: getErrorMessage(err, '회원 정보를 수정하지 못했습니다.'), isLoading: false });
      throw err;
    }
  },

  // 3. 회원 정지 (PATCH /api/admin/users/{userId}/suspend)
  suspendUser: async (userId, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const data = await suspendUser(userId, endDate);
      set({ isLoading: false });
      return data;
    } catch (err) {
      set({ error: getErrorMessage(err, '회원을 정지하지 못했습니다.'), isLoading: false });
      throw err;
    }
  },

  // 4. 회원 영구차단 - 단일/다중 (PATCH /api/admin/users/ban)
  banUsers: async (userIds) => {
    set({ isLoading: true, error: null });
    try {
      const data = await banUsers(userIds);
      set({ isLoading: false });
      return data;
    } catch (err) {
      set({ error: getErrorMessage(err, '회원을 영구 차단하지 못했습니다.'), isLoading: false });
      throw err;
    }
  },

  // 5. 회원 강제 탈퇴 (PATCH /api/admin/users/{userId}/withdraw) [ADMIN_LV3]
  withdrawUser: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const data = await withdrawUser(userId);
      set({ isLoading: false });
      return data;
    } catch (err) {
      set({ error: getErrorMessage(err, '회원을 강제 탈퇴하지 못했습니다.'), isLoading: false });
      throw err;
    }
  },

  // 에러 문구 초기화 (안내 노출 후 닫을 때)
  clearError: () => set({ error: null }),
}));

export default useAdminUsersStore;
