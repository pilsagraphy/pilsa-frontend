import { create } from 'zustand';
import {
  getSanctionedUsers,
  getSanctionedUserDetail,
  getSanctionedUserReportedPosts,
  getSanctionedUserReportedComments,
} from '@/apis/admin/sanctions';

// 회원을 빠르게 갈아타면 먼저 보낸 요청이 나중에 도착해 최신 응답을 덮을 수 있다.
// 리소스마다 요청에 번호를 매기고, 마지막으로 보낸 번호의 응답만 반영한다.
// 상태가 아니라 모듈 변수로 두는 이유: 번호가 바뀔 때마다 리렌더가 일어나면 안 된다.
const lastRequestId = {
  users: 0,
  detail: 0,
  reportedPosts: 0,
  reportedComments: 0,
};

// 실패를 화면에 보여줄 한 줄로 바꾼다.
// 제재 관리 API 는 전부 401(미인증) / 403(관리자 권한 없음) 을 { message } 와 함께 내려준다.
// 셋을 '불러오지 못했습니다' 하나로 뭉치면 관리자가 재시도하면 되는 일시적 장애인지,
// 다시 로그인해야 하는지, 애초에 권한이 없어 재시도가 소용없는지를 구분할 수 없다.
// 서버 문구가 있으면 그대로 쓰고, 없을 때만 상황별 기본 문구로 채운다.
function toErrorMessage(error, fallback) {
  const status = error?.response?.status;
  const serverMessage = error?.response?.data?.message;

  if (status === 401) return serverMessage ?? '로그인이 만료되었습니다. 다시 로그인해 주세요.';
  if (status === 403) return serverMessage ?? '관리자 권한이 없습니다.';

  // 응답 자체가 없으면(네트워크 단절·타임아웃) 서버 문구도 없다 → 리소스별 기본 문구
  return serverMessage ?? fallback;
}

// 관리자 - 제재 회원 관리 스토어
// 목록 / 상세 / 신고된 게시글 / 신고된 댓글 4개 리소스를 각각
// { isLoading, data, error } 세트로 따로 관리한다 (선택한 회원에 따라 독립적으로 로드됨).
// 회원별 리소스(상세·신고 내역)에는 userId 가 하나 더 붙는다 — 아래 참고.
const useSanctionStore = create((set) => ({
  // 1. 제재 회원 목록
  users: { isLoading: false, data: [], error: null },

  // 2~4. 회원별 리소스. userId 는 지금 담긴 값이 '어느 회원의 것인지'를 나타낸다.
  // 회원을 고른 뒤 fetch 는 useEffect(페인트 이후)에서 시작하므로 한 프레임 동안
  // 이전 회원의 데이터가 그대로 남는데, 화면이 이 값을 보고 걸러낸다.

  // 2. 제재 회원 상세
  detail: { isLoading: false, data: null, error: null, userId: null },

  // 3. 회원별 신고된 게시글 내역
  reportedPosts: { isLoading: false, data: [], error: null, userId: null },

  // 4. 회원별 신고된 댓글 내역
  reportedComments: { isLoading: false, data: [], error: null, userId: null },

  // 1. 제재 회원 목록 조회
  fetchSanctionedUsers: async () => {
    const requestId = ++lastRequestId.users;
    set({ users: { isLoading: true, data: [], error: null } });
    try {
      const data = await getSanctionedUsers();
      if (requestId !== lastRequestId.users) return; // 더 최신 요청이 있다 → 이 응답은 버린다
      set({ users: { isLoading: false, data: data ?? [], error: null } });
    } catch (error) {
      if (requestId !== lastRequestId.users) return;
      set({
        users: {
          isLoading: false,
          data: [],
          error: toErrorMessage(error, '제재 회원 목록을 불러오지 못했습니다.'),
        },
      });
    }
  },

  // 2. 제재 회원 상세 조회
  fetchSanctionedUserDetail: async (userId) => {
    const requestId = ++lastRequestId.detail;
    set({ detail: { isLoading: true, data: null, error: null, userId } });
    try {
      const data = await getSanctionedUserDetail(userId);
      if (requestId !== lastRequestId.detail) return;
      set({ detail: { isLoading: false, data: data ?? null, error: null, userId } });
    } catch (error) {
      if (requestId !== lastRequestId.detail) return;
      set({
        detail: {
          isLoading: false,
          data: null,
          error: toErrorMessage(error, '제재 회원 정보를 불러오지 못했습니다.'),
          userId,
        },
      });
    }
  },

  // 3. 회원별 신고된 게시글 내역 조회
  fetchSanctionedUserReportedPosts: async (userId) => {
    const requestId = ++lastRequestId.reportedPosts;
    set({ reportedPosts: { isLoading: true, data: [], error: null, userId } });
    try {
      const data = await getSanctionedUserReportedPosts(userId);
      if (requestId !== lastRequestId.reportedPosts) return;
      set({ reportedPosts: { isLoading: false, data: data ?? [], error: null, userId } });
    } catch (error) {
      if (requestId !== lastRequestId.reportedPosts) return;
      set({
        reportedPosts: {
          isLoading: false,
          data: [],
          error: toErrorMessage(error, '신고된 게시글 내역을 불러오지 못했습니다.'),
          userId,
        },
      });
    }
  },

  // 4. 회원별 신고된 댓글 내역 조회
  fetchSanctionedUserReportedComments: async (userId) => {
    const requestId = ++lastRequestId.reportedComments;
    set({ reportedComments: { isLoading: true, data: [], error: null, userId } });
    try {
      const data = await getSanctionedUserReportedComments(userId);
      if (requestId !== lastRequestId.reportedComments) return;
      set({ reportedComments: { isLoading: false, data: data ?? [], error: null, userId } });
    } catch (error) {
      if (requestId !== lastRequestId.reportedComments) return;
      set({
        reportedComments: {
          isLoading: false,
          data: [],
          error: toErrorMessage(error, '신고된 댓글 내역을 불러오지 못했습니다.'),
          userId,
        },
      });
    }
  },
}));

export default useSanctionStore;
