import { create } from 'zustand';

import {
  getDashboardStats,
  getRecentReports,
  getRecentMembers,
} from '@/apis/admin/dashboard';

// 관리자 홈(대시보드) 상태
//
// 한 화면이지만 통계 수치 · 최근 신고 · 최근 가입 세 영역이 각자 다른 API 를 부른다.
// 한 영역이 늦게 와도 다른 영역의 로딩 표시가 켜지면 안 되므로
// isLoading / data / error 세트를 영역마다 따로 둔다.
//
// catch 에는 서버가 보낸 문구 대신 사용자가 읽을 한국어 문장을 넣는다.
const useAdminDashboardStore = create((set) => ({
  // ── 1) 통계 수치 (GET /api/admin/dashboard) ──
  stats: null, // { newMembers, pendingReports, newPosts, totalMembers }
  isStatsLoading: false,
  statsError: null,

  // ── 2) 최근 신고 목록 (GET /api/admin/dashboard/recent-reports) ──
  recentReports: [], // [{ targetType, targetId, postId, boardId, boardName, preview, createdAt }]
  isReportsLoading: false,
  reportsError: null,

  // ── 3) 최근 가입 회원 목록 (GET /api/admin/dashboard/recent-members) ──
  recentMembers: [], // [{ userId, memberType, loginId, name, joinedAt }]
  isMembersLoading: false,
  membersError: null,

  // 통계 수치 불러오기
  fetchStats: async () => {
    set({ isStatsLoading: true, statsError: null }); // 시작: 로딩 켜고 이전 에러 지우기
    try {
      const data = await getDashboardStats();
      set({ stats: data });
    } catch {
      set({ stats: null, statsError: '통계 정보를 불러오지 못했습니다.' });
    } finally {
      set({ isStatsLoading: false }); // 성공이든 실패든 반드시 로딩 끄기
    }
  },

  // 최근 신고 목록 불러오기 (size 선택, 서버 기본 5)
  fetchRecentReports: async (size) => {
    set({ isReportsLoading: true, reportsError: null });
    try {
      const data = await getRecentReports(size);
      set({ recentReports: data });
    } catch {
      set({ recentReports: [], reportsError: '최근 신고 목록을 불러오지 못했습니다.' });
    } finally {
      set({ isReportsLoading: false });
    }
  },

  // 최근 가입 회원 목록 불러오기 (size 선택, 서버 기본 5)
  fetchRecentMembers: async (size) => {
    set({ isMembersLoading: true, membersError: null });
    try {
      const data = await getRecentMembers(size);
      set({ recentMembers: data });
    } catch {
      set({ recentMembers: [], membersError: '최근 가입 회원 목록을 불러오지 못했습니다.' });
    } finally {
      set({ isMembersLoading: false });
    }
  },

  // 화면을 떠날 때 이전 결과가 남지 않도록 초기화
  reset: () =>
    set({
      stats: null,
      isStatsLoading: false,
      statsError: null,
      recentReports: [],
      isReportsLoading: false,
      reportsError: null,
      recentMembers: [],
      isMembersLoading: false,
      membersError: null,
    }),
}));

export default useAdminDashboardStore;
