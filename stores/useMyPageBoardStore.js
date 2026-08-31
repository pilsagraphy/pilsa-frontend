import { create } from 'zustand';

import { getMyPosts, getMyComments, getMyLikes } from '@/apis/mypage';

// 탭 key → 호출할 API 함수
const FETCHERS = {
  posts: getMyPosts,
  comments: getMyComments,
  likes: getMyLikes,
};

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

    set({ isLoading: true, error: null }); // 시작: 로딩 켜고 이전 에러 지우기
    try {
      const data = await fetcher(params);
      // 글/좋아요는 data.posts, 댓글은 data.comments 로 내려온다
      const items = data.posts ?? data.comments ?? [];
      set({
        items,
        totalPages: data.totalPages ?? 0,
        totalCount: data.totalCount ?? 0,
        isLoading: false,
      });
    } catch (e) {
      set({ error: '목록을 불러오지 못했습니다.', isLoading: false, items: [] });
    }
  },
}));

export default useMyPageBoardStore;
