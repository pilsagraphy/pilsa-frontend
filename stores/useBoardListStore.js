import { create } from 'zustand';

// 게시판 목록 화면이 받아 온 결과와 스크롤 위치를 네비게이션을 넘어 기억한다.
//
// 글을 보고 뒤로 돌아오면 BoardSection 이 새로 마운트돼 posts 가 [] 로 시작하고, 그 첫 페인트는
// "불러오는 중" 한 줄뿐이라 브라우저가 스크롤을 복원하려 해도 문서가 짧아 0 으로 잘렸다 —
// "목록 맨 위로 올라간다" (테스터 제보, 2026-10-02). 여기 담아 둔 결과로 첫 페인트부터 행을 그리고,
// 떠날 때 적어 둔 scrollY 로 돌아간다. 새로고침하면 스토어가 비어 저절로 맨 위에서 시작한다.
//
// 키: boardId|page|sort|keyword|categoryId — 같은 조건으로 돌아왔을 때만 쓴다.
// 계정이 바뀌면 전부 버린다 (useAuthStore.logout → reset).
export const listKey = (boardId, { page, sort, keyword, categoryId }) =>
  [boardId, page, sort, keyword ?? '', categoryId ?? ''].join('|');

const useBoardListStore = create((set) => ({
  entries: {}, // { [key]: { posts, totalPages, scrollY } }

  remember: (key, { posts, totalPages }) =>
    set((state) => ({
      entries: { ...state.entries, [key]: { ...(state.entries[key] ?? {}), posts, totalPages } },
    })),

  rememberScroll: (key, scrollY) =>
    set((state) =>
      state.entries[key]
        ? { entries: { ...state.entries, [key]: { ...state.entries[key], scrollY } } }
        : state
    ),

  reset: () => set({ entries: {} }),
}));

export default useBoardListStore;
