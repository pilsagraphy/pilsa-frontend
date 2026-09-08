import { create } from 'zustand';

import { getAdminComments } from '@/apis/admin/comments';

import createModerationListSlice from './createModerationListSlice';

// 관리자 - 댓글 관리 상태
//
// 목록 조회 · 블라인드 · 삭제는 게시글 관리와 하는 일이 같아 공용 슬라이스를 쓴다.
// 여기서 정하는 것은 대상 종류(comment)와 부를 API, 그리고 실패 문구뿐이다.
// (조치는 신고 관리와 같은 select-* API 다 — apis/admin/reports.js)
const useAdminCommentStore = create(
  createModerationListSlice({
    targetType: 'comment',
    fetchPage: getAdminComments,
    listKey: 'comments',
    messages: {
      fetch: '댓글 목록을 불러오지 못했습니다.',
      blind: '블라인드 처리에 실패했습니다.',
      remove: '삭제 처리에 실패했습니다.',
    },
  })
);

export default useAdminCommentStore;
