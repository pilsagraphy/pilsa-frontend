import { create } from 'zustand';

import { getErrorMessage } from '@/apis/auth';
import { getAdminPost, getAdminPosts } from '@/apis/admin/posts';

import createModerationListSlice from './createModerationListSlice';

// 관리자 - 게시글 관리 상태
//
// 목록 조회 · 블라인드 · 삭제는 댓글 관리와 하는 일이 같아 공용 슬라이스를 쓴다.
// 게시글에만 있는 상세 화면(관리자 전용 게시글 상세)만 여기서 덧붙인다.
const DETAIL_FALLBACK_MESSAGE = '게시글을 불러오지 못했습니다.';

const listSlice = createModerationListSlice({
  targetType: 'post',
  fetchPage: getAdminPosts,
  listKey: 'posts',
  messages: {
    fetch: '게시글 목록을 불러오지 못했습니다.',
    blind: '블라인드 처리에 실패했습니다.',
    remove: '삭제 처리에 실패했습니다.',
  },
});

const useAdminPostStore = create((set, get) => ({
  ...listSlice(set, get),

  // 상세 화면용. 목록과 요청이 겹치지 않도록 상태를 따로 둔다
  // (상세를 보는 동안 목록의 로딩 표시가 켜지면 안 된다)
  isDetailLoading: false,
  detail: null,
  detailError: null,

  // detail · detailError 가 어느 글의 결과인지.
  // 스토어가 싱글턴이라 화면을 옮겨도 이전 글의 결과가 남아 있어, 화면이
  // '지금 보려는 글의 결과가 맞는지' 확인할 수 있어야 한다.
  detailPostId: null,

  // 상세 조회 (GET /api/admin/posts/{postId})
  // 익명글도 실작성자가 나오고 모든 상태의 댓글이 함께 온다. 조회수는 늘지 않는다.
  fetchPost: async (postId) => {
    // 이전 글을 비우고 시작한다. 안 비우면 다른 글로 옮겼을 때
    // 새 글을 받아오는 동안 이전 글의 제목·본문이 잠깐 그려진다.
    set({ isDetailLoading: true, detail: null, detailError: null, detailPostId: postId });
    try {
      const detail = await getAdminPost(postId);
      set({ detail });
      return detail;
    } catch (err) {
      set({ detail: null, detailError: getErrorMessage(err, DETAIL_FALLBACK_MESSAGE) });
      return null;
    } finally {
      set({ isDetailLoading: false });
    }
  },
}));

export default useAdminPostStore;
