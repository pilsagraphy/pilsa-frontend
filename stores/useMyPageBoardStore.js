import { create } from 'zustand';

import { getMyPosts, getMyComments, getMyLikes } from '@/apis/mypage';

// 탭 key → 호출할 API 함수
const FETCHERS = {
  posts: getMyPosts,
  comments: getMyComments,
  likes: getMyLikes,
};

// 요청 순번 — 빠르게 탭을 바꿀 때 '먼저 보냈지만 늦게 온 응답'이 최신 화면을 덮지 않게 한다.
let reqId = 0;

// 마이페이지 활동 목록(내 글/내 댓글/좋아요) 상태
const useMyPageBoardStore = create((set) => ({
  // 상태 3종 세트 (+ 페이지네이션 정보)
  items: [], // 현재 탭 목록
  totalPages: 0,
  totalCount: 0,
  isLoading: false,
  error: null,

  // 탭별 목록 불러오기. tab: 'posts' | 'comments' | 'likes'
  fetchList: async (tab, params = {}) => {
    const fetcher = FETCHERS[tab];
    if (!fetcher) return;

    const myId = (reqId += 1); // 이번 요청 순번
    set({ isLoading: true, error: null });
    try {
      const data = await fetcher(params);
      if (myId !== reqId) return; // 더 최신 요청이 있으면 이 응답은 버린다
      // 글/좋아요는 data.posts, 댓글은 data.comments 로 내려온다
      set({
        items: data.posts ?? data.comments ?? [],
        totalPages: data.totalPages ?? 0,
        totalCount: data.totalCount ?? 0,
        isLoading: false,
      });
    } catch (e) {
      if (myId !== reqId) return;
      // 에러면 페이지네이션 정보도 초기화 (이전 페이지 수가 남아있지 않게)
      set({
        error: '목록을 불러오지 못했습니다.',
        isLoading: false,
        items: [],
        totalPages: 0,
        totalCount: 0,
      });
    }
  },

  // 이전 사용자의 목록이 남지 않도록 초기화 (마이페이지를 떠날 때 호출)
  reset: () => {
    reqId += 1; // 진행 중이던 응답도 무효화
    set({ items: [], totalPages: 0, totalCount: 0, isLoading: false, error: null });
  },
}));

export default useMyPageBoardStore;
