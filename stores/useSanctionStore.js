import { create } from 'zustand';
import {
  getSanctionedUsers,
  getSanctionedUserDetail,
  getSanctionedUserReportedPosts,
  getSanctionedUserReportedComments,
} from '@/apis/admin/sanctions';

// 관리자 - 제재 회원 관리 스토어
// 목록 / 상세 / 신고된 게시글 / 신고된 댓글 4개 리소스를 각각
// { isLoading, data, error } 세트로 따로 관리한다 (선택한 회원에 따라 독립적으로 로드됨).
const useSanctionStore = create((set) => ({
  // 1. 제재 회원 목록
  users: { isLoading: false, data: [], error: null },

  // 2. 제재 회원 상세
  detail: { isLoading: false, data: null, error: null },

  // 3. 회원별 신고된 게시글 내역
  reportedPosts: { isLoading: false, data: [], error: null },

  // 4. 회원별 신고된 댓글 내역
  reportedComments: { isLoading: false, data: [], error: null },

  // 1. 제재 회원 목록 조회
  fetchSanctionedUsers: async () => {
    set({ users: { isLoading: true, data: [], error: null } });
    try {
      const data = await getSanctionedUsers();
      set({ users: { isLoading: false, data: data ?? [], error: null } });
    } catch {
      set({
        users: {
          isLoading: false,
          data: [],
          error: '제재 회원 목록을 불러오지 못했습니다.',
        },
      });
    }
  },

  // 2. 제재 회원 상세 조회
  fetchSanctionedUserDetail: async (userId) => {
    set({ detail: { isLoading: true, data: null, error: null } });
    try {
      const data = await getSanctionedUserDetail(userId);
      set({ detail: { isLoading: false, data: data ?? null, error: null } });
    } catch {
      set({
        detail: {
          isLoading: false,
          data: null,
          error: '제재 회원 정보를 불러오지 못했습니다.',
        },
      });
    }
  },

  // 3. 회원별 신고된 게시글 내역 조회
  fetchSanctionedUserReportedPosts: async (userId) => {
    set({ reportedPosts: { isLoading: true, data: [], error: null } });
    try {
      const data = await getSanctionedUserReportedPosts(userId);
      set({ reportedPosts: { isLoading: false, data: data ?? [], error: null } });
    } catch {
      set({
        reportedPosts: {
          isLoading: false,
          data: [],
          error: '신고된 게시글 내역을 불러오지 못했습니다.',
        },
      });
    }
  },

  // 4. 회원별 신고된 댓글 내역 조회
  fetchSanctionedUserReportedComments: async (userId) => {
    set({ reportedComments: { isLoading: true, data: [], error: null } });
    try {
      const data = await getSanctionedUserReportedComments(userId);
      set({ reportedComments: { isLoading: false, data: data ?? [], error: null } });
    } catch {
      set({
        reportedComments: {
          isLoading: false,
          data: [],
          error: '신고된 댓글 내역을 불러오지 못했습니다.',
        },
      });
    }
  },
}));

export default useSanctionStore;
