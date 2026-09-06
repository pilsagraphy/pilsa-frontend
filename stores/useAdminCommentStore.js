import { create } from 'zustand';

import { getErrorMessage } from '@/apis/auth';
import { getAdminComments } from '@/apis/admin/comments';
import { selectBlind, selectDelete } from '@/apis/admin/reports';

// 관리자 - 댓글 관리 상태
//
// isLoading / data / error 세 개를 한 세트로 관리한다.
//  - isLoading : 요청 시작에 true, 끝나면 성공·실패 상관없이 finally 에서 반드시 false
//  - data      : 댓글 목록. 서버가 준 값을 그대로 담는다
//  - error     : 화면에 그대로 띄울 한국어 문장 (요청 시작 시 null 로 비운다)
//
// 게시글 관리와 같은 select-* API 를 쓰지만 targetType 과 갱신할 목록이 다르므로
// 스토어를 따로 둔다 (신고 관리도 같은 API 를 쓴다 — apis/admin/reports.js).
const FALLBACK_MESSAGES = {
  fetch: '댓글 목록을 불러오지 못했습니다.',
  blind: '블라인드 처리에 실패했습니다.',
  remove: '삭제 처리에 실패했습니다.',
};

const TARGET_TYPE = 'comment';

// 마지막으로 보낸 목록 조회의 번호.
// 페이지를 빨리 넘기거나 검색어를 고치면 요청이 여럿 겹치는데, 먼저 보낸 것이
// 늦게 도착하면 화면과 다른 페이지의 목록이 표시된다. 응답을 쓰기 직전에 번호를 확인한다.
let listSeq = 0;

const useAdminCommentStore = create((set, get) => ({
  isLoading: false,
  data: [],
  error: null,

  // 목록 응답에 실린 값을 그대로 쓴다 (직접 계산하지 않는다)
  totalPages: 1,
  totalCount: 0,

  reset: () => set({ isLoading: false, data: [], error: null, totalPages: 1, totalCount: 0 }),

  // 1. 목록 조회 (GET /api/admin/comments)
  // params: { page, size, boardId, keyword } — 빈 값은 부르는 쪽에서 빼고 넘긴다
  fetchComments: async (params = {}) => {
    const seq = ++listSeq;
    // 이 요청이 아직 최신인지. 뒤처진 응답은 화면에 쓰지 않고 버린다.
    const isStale = () => seq !== listSeq;

    set({ isLoading: true, error: null });
    try {
      const result = await getAdminComments(params);
      if (isStale()) return result;

      set({
        data: Array.isArray(result?.comments) ? result.comments : [],
        totalPages: Math.max(1, Number(result?.totalPages) || 1),
        totalCount: Number(result?.totalCount) || 0,
      });
      return result;
    } catch (err) {
      if (isStale()) return null;

      set({ error: getErrorMessage(err, FALLBACK_MESSAGES.fetch) });
      return null;
    } finally {
      // 뒤처진 요청이 최신 요청의 로딩 표시를 끄지 않게 한다
      if (!isStale()) set({ isLoading: false });
    }
  },

  // 2. 블라인드 · 삭제 조치 (PATCH /api/admin/reports/select-blind | select-delete)
  //
  // 항목마다 독립 트랜잭션이라 일부만 실패할 수 있다 (부분 성공).
  // 응답 { successCount, failCount, failures: [{ id, message }] } 를 그대로 돌려주고,
  // 어떻게 알릴지는 화면이 판단한다.
  //
  // reasonId 가 null 이면 키를 넣지 않는다 — 서버가 대표(최신) 신고 사유를 대신 쓴다.
  // detail 은 '기타' 사유일 때만 보낸다.
  moderateComments: async (action, commentIds, { reasonId, detail } = {}) => {
    const request = action === 'delete' ? selectDelete : selectBlind;
    const fallback = action === 'delete' ? FALLBACK_MESSAGES.remove : FALLBACK_MESSAGES.blind;

    const body = {
      targetType: TARGET_TYPE,
      // 중복은 보내지 않는다. 서버가 한 번만 처리한다고 명세에 적혀 있지만,
      // 삭제는 작성자에게 주의 +2 를 붙이므로 같은 id 가 여러 번 실린 요청은
      // 애초에 만들지 않는 편이 안전하다 (여기가 네트워크로 나가기 전 마지막 관문이다).
      targetIds: [...new Set(commentIds)],
      ...(reasonId != null ? { reasonId } : {}),
      ...(detail ? { detail } : {}),
    };

    set({ isLoading: true, error: null });
    try {
      return await request(body);
    } catch (err) {
      set({ error: getErrorMessage(err, fallback) });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  // 실패 문구를 꺼내면서 비운다.
  // 안 비우면 빈 목록 안내문 자리에 지난 조치의 실패 문구가 남는다.
  takeError: () => {
    const { error } = get();
    if (error) set({ error: null });
    return error;
  },
}));

export default useAdminCommentStore;
