import { create } from 'zustand';
import { getBoards } from '@/apis/board';
import { getErrorMessage } from '@/apis/auth';
import useAuthStore from '@/stores/useAuthStore';

// 사이드바 게시판 목록 전역 스토어.
// 메뉴 전체가 쓰고 화면 이동해도 유지돼야 하는 값이라 전역으로 둔다 (하드코딩 금지).
// 응답: [{ boardId, boardName, displayOrder, canWrite, allowComment,
//         allowAttachment, categoryMode, allowAnonymous, allowPrivateComment }]
// { isLoading, data, error } 를 항상 세트로 관리한다.
//  - 요청 시작: isLoading = true, error = null
//  - 요청 종료: 성공이든 실패든 반드시 isLoading = false
//  - 실패: error 에 사용자용 한국어 문장을 담는다

// 사이드바와 게시판 화면들이 동시에 목록을 요청해도 한 번만 나가도록 진행 중 요청을 재사용한다.
let inflight = null;

const currentUserId = () => useAuthStore.getState().user?.userId ?? null;

const useBoardStore = create((set, get) => ({
  isLoading: false,
  data: null, // 게시판 목록
  error: null,

  // 이 목록이 누구 것인지. 게시판 목록은 '그 사람이 볼 수 있는 게시판'이라
  // 계정이 바뀌면 반드시 버려야 한다 (안 버리면 이전 계정의 메뉴와 권한 플래그가 그대로 적용된다).
  ownerUserId: null,

  // 게시판 목록 조회 (GET /api/user/boards)
  fetchBoards: async () => {
    if (inflight) return inflight;

    const owner = currentUserId();
    set({ isLoading: true, error: null });

    inflight = (async () => {
      try {
        const data = await getBoards();
        set({ data, ownerUserId: owner, isLoading: false });
        return data;
      } catch (err) {
        set({
          error: getErrorMessage(err, '게시판 목록을 불러오지 못했습니다.'),
          isLoading: false,
        });
        return undefined;
      } finally {
        inflight = null;
      }
    })();

    return inflight;
  },

  // 화면들이 부르는 진입점 — 필요할 때만 조회한다.
  // 계정이 바뀌었으면 캐시를 버리고 새로 받는다.
  ensureBoards: () => {
    const { data, ownerUserId, fetchBoards, reset } = get();

    if (ownerUserId !== currentUserId()) {
      reset();
      return fetchBoards();
    }

    if (data == null) return fetchBoards();
    return Promise.resolve(data);
  },

  // 계정 전환/로그아웃 시 캐시 폐기.
  // 진행 중인 요청도 함께 무효화한다 — 안 하면 리셋 직후의 fetchBoards 가
  // 로그아웃 직전에 나간 이전 계정 요청의 응답을 그대로 받아 쓴다.
  reset: () => {
    inflight = null;
    set({ isLoading: false, data: null, error: null, ownerUserId: null });
  },

  // boardId 로 게시판(플래그 포함) 찾기
  getBoard: (boardId) => get().data?.find((b) => String(b.boardId) === String(boardId)) ?? null,
}));

export default useBoardStore;
