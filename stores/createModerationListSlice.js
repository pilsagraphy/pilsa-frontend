import { getErrorMessage } from '@/apis/auth';
import { selectBlind, selectDelete } from '@/apis/admin/reports';

// 관리자 - 게시글 관리 · 댓글 관리가 공유하는 '목록 + 조치' 상태.
//
// 두 화면은 다루는 대상만 다르고 하는 일이 같다.
//  - 목록 · 검색 · 페이지네이션을 서버에 맡기고 응답을 그대로 담는다
//  - 블라인드 · 삭제는 신고 관리와 같은 select-* API 를 targetType 만 바꿔 부른다
// 그래서 스토어를 통째로 두 벌 두지 않고 이 슬라이스를 각 스토어가 펼쳐 쓴다.
// (신고 관리 API 연동에서 세 번째 사본이 생기지 않도록)
//
// 상태 규칙
//  - isLoading    : 목록 조회 중. 끝나면 성공·실패 상관없이 finally 에서 반드시 false
//  - isSubmitting : 조치 요청 중. 목록 조회와 섞이면 '조회 중'과 '처리 중'을 구분할 수 없어 따로 둔다
//  - hasFetched   : 첫 응답을 받아봤는지. isLoading 초기값이 false 라 이게 없으면
//                   아직 아무것도 요청하지 않은 첫 프레임이 '결과 없음'으로 보인다
//  - data         : 목록. 서버가 준 값을 그대로 담는다
//  - error        : 화면에 그대로 띄울 한국어 문장 (요청 시작 시 null 로 비운다)
//
// @param {'post'|'comment'} targetType  select-* API 에 보낼 대상 종류
// @param {Function} fetchPage           (params) => 목록 응답 (apis/admin 의 조회 함수)
// @param {string} listKey               응답에서 배열이 들어 있는 키 ('posts' | 'comments')
// @param {object} messages              서버가 문장을 안 줄 때 쓸 { fetch, blind, remove }
export default function createModerationListSlice({ targetType, fetchPage, listKey, messages }) {
  // 마지막으로 보낸 목록 조회의 번호. 스토어마다 하나씩 닫혀 있다.
  // 페이지를 빨리 넘기거나 검색어를 고치면 요청이 여럿 겹치는데, 먼저 보낸 것이
  // 늦게 도착하면 화면과 다른 페이지의 목록이 표시된다. 응답을 쓰기 직전에 번호를 확인한다.
  let listSeq = 0;

  return (set, get) => ({
    isLoading: false,
    isSubmitting: false,
    hasFetched: false,
    data: [],
    error: null,

    // 목록 응답에 실린 값을 그대로 쓴다 (직접 계산하지 않는다)
    totalPages: 1,
    // 아직 화면에 쓰는 곳은 없지만 '전체 N건' 표기가 붙을 자리라 응답 값을 들고만 있는다
    totalCount: 0,

    // 화면을 떠날 때 부른다. 스토어는 싱글턴이라 비워두지 않으면 다시 들어왔을 때
    // 페이지 번호는 1인데 표에는 지난번 페이지가 잠깐 보인다.
    reset: () => {
      // 진행 중이던 조회의 응답을 버린다 (돌아온 뒤 비운 목록을 다시 채우면 안 된다)
      listSeq += 1;

      set({
        isLoading: false,
        isSubmitting: false,
        hasFetched: false,
        data: [],
        error: null,
        totalPages: 1,
        totalCount: 0,
      });
    },

    // 1. 목록 조회
    // params: { page, size, boardId, keyword } — 빈 값은 부르는 쪽에서 빼고 넘긴다
    fetchList: async (params = {}) => {
      const seq = ++listSeq;
      // 이 요청이 아직 최신인지. 뒤처진 응답은 화면에 쓰지 않고 버린다.
      const isStale = () => seq !== listSeq;

      set({ isLoading: true, error: null });
      try {
        const result = await fetchPage(params);
        if (isStale()) return result;

        set({
          data: Array.isArray(result?.[listKey]) ? result[listKey] : [],
          totalPages: Math.max(1, Number(result?.totalPages) || 1),
          totalCount: Number(result?.totalCount) || 0,
        });
        return result;
      } catch (err) {
        if (isStale()) return null;

        set({ error: getErrorMessage(err, messages.fetch) });
        return null;
      } finally {
        // 뒤처진 요청이 최신 요청의 로딩 표시를 끄지 않게 한다
        // (성공이든 실패든 한 번 돌아왔으면 hasFetched 를 세운다)
        if (!isStale()) set({ isLoading: false, hasFetched: true });
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
    moderate: async (action, ids, { reasonId, detail } = {}) => {
      const request = action === 'delete' ? selectDelete : selectBlind;
      const fallback = action === 'delete' ? messages.remove : messages.blind;

      const body = {
        targetType,
        // 중복은 보내지 않는다. 서버가 한 번만 처리한다고 명세에 적혀 있지만,
        // 삭제는 작성자에게 주의 +2 를 붙이므로 같은 id 가 여러 번 실린 요청은
        // 애초에 만들지 않는 편이 안전하다 (여기가 네트워크로 나가기 전 마지막 관문이다).
        targetIds: [...new Set(ids)],
        ...(reasonId != null ? { reasonId } : {}),
        ...(detail ? { detail } : {}),
      };

      set({ isSubmitting: true, error: null });
      try {
        return await request(body);
      } catch (err) {
        set({ error: getErrorMessage(err, fallback) });
        return null;
      } finally {
        set({ isSubmitting: false });
      }
    },

    // 실패 문구를 꺼내면서 비운다.
    // 안 비우면 빈 목록 안내문 자리에 지난 조치의 실패 문구가 남는다.
    takeError: () => {
      const { error } = get();
      if (error) set({ error: null });
      return error;
    },
  });
}
