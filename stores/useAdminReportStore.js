import { create } from 'zustand';

import { getErrorMessage } from '@/apis/auth';
import {
  blindReportTargets,
  deleteReportTargets,
  getReportedComments,
  getReportedPosts,
  restoreReportTargets,
} from '@/apis/admin/reports';
import { REPORT_TARGET_COMMENT } from '@/constants/adminReports';

// 관리자 - 신고 관리 목록 스토어.
// apis/admin/reports.js 는 통신만 하므로, 탭·조치별 함수 선택과 응답 기본값 채우기는 여기서 한다.
//
// { isLoading, items, error } 를 항상 세트로 관리한다.
//  - 요청 시작: isLoading = true, error = null
//  - 요청 종료: 성공이든 실패든 반드시 isLoading = false
//  - 실패: error 에 사용자용 한국어 문장을 담는다
//
// 필터 · 페이지 · 탭 같은 화면 상태는 스토어에 두지 않는다 — 화면이 들고 있다가 조회 조건으로 넘긴다.

// 목록은 탭(대상 종류)으로 경로가 갈린다
const listRequest = (targetType) =>
  targetType === REPORT_TARGET_COMMENT ? getReportedComments : getReportedPosts;

// 조치 이름 → 요청 함수. 값은 constants/adminReports.js 의 REPORT_ACTION_* 과 같다
const ACTION_REQUESTS = {
  restore: restoreReportTargets,
  delete: deleteReportTargets,
  blind: blindReportTargets,
};

// 값이 없는 필터는 아예 빼서 보낸다 — state 에 'all' 이나 빈 문자열을 실어 보내면
// 서버가 모르는 값으로 보고 필터를 무시한다 (state=normal 도 인식하지 않는다)
const toListParams = ({ page, size, state, boardId, keyword, sort }) => ({
  page,
  size,
  ...(state ? { state } : {}),
  ...(boardId != null ? { boardId } : {}),
  ...(keyword?.trim() ? { keyword: keyword.trim() } : {}),
  ...(sort ? { sort } : {}),
});

// 필터를 빠르게 연달아 바꾸면 앞선 요청이 늦게 도착해 최신 결과를 덮어쓸 수 있다.
// 요청마다 번호를 매겨 마지막 요청의 응답만 반영한다.
let latestRequestId = 0;

const useAdminReportStore = create((set) => ({
  isLoading: false,
  error: null,

  items: [],
  totalPages: 1,
  totalCount: 0,

  // 신고 목록 조회. 응답 필드는 서버 그대로 쓴다 (화면이 같은 이름으로 읽는다)
  fetchReports: async (targetType, params) => {
    const requestId = ++latestRequestId;
    set({ isLoading: true, error: null });

    try {
      const data = await listRequest(targetType)(toListParams(params));

      // 이미 다음 요청이 나갔으면 이 응답은 버린다 (늦게 온 옛 결과가 화면을 되돌리는 것을 막는다)
      if (requestId !== latestRequestId) return undefined;

      set({
        items: data?.items ?? [],
        // 목록이 비어도 페이지네이션이 0페이지를 가리키지 않도록 최소 1로 둔다
        totalPages: data?.totalPages ?? 1,
        totalCount: data?.totalCount ?? 0,
        isLoading: false,
      });

      return data;
    } catch (err) {
      if (requestId !== latestRequestId) return undefined;

      // 실패했으면 이전 목록을 남겨두지 않는다 — 낡은 목록에 조치를 걸면 엉뚱한 대상이 처리된다
      set({
        items: [],
        totalPages: 1,
        totalCount: 0,
        error: getErrorMessage(err, '신고 목록을 불러오지 못했습니다.'),
        isLoading: false,
      });

      return undefined;
    }
  },

  // 복원 · 삭제 · 블라인드 조치. 목록 갱신은 호출한 화면이 응답을 안내한 뒤 재조회로 처리한다
  // (부분 실패가 있고, 조치 뒤 그 행의 상태가 어떻게 바뀌는지는 서버가 정한다)
  //
  // 성공/실패를 예외로 던지지 않고 { ok, data, error } 로 돌려준다 —
  // 부분 실패(successCount·failCount)는 예외가 아니라 정상 응답이므로 화면이 두 경우를 같은 자리에서
  // 다뤄야 안내 문구를 한 곳에서 만들 수 있다.
  runReportAction: async (action, { targetType, targetIds, reasonId, detail }) => {
    const request = ACTION_REQUESTS[action];
    if (!request) return { ok: false, error: '알 수 없는 조치입니다.' };

    try {
      const data = await request({
        targetType,
        targetIds,
        // 복원은 사유를 받지 않는다. reasonId 를 빼면 서버가 대표(최신) 신고 사유를 쓴다
        ...(reasonId != null ? { reasonId } : {}),
        // detail 은 사유가 '기타'일 때만 값이 있다
        ...(detail?.trim() ? { detail: detail.trim() } : {}),
      });

      return { ok: true, data };
    } catch (err) {
      return { ok: false, error: getErrorMessage(err, '조치에 실패했습니다.') };
    }
  },
}));

export default useAdminReportStore;
