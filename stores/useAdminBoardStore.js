import { create } from 'zustand';

import { getErrorMessage } from '@/apis/auth';
import {
  createAdminBoard,
  deleteAdminBoard,
  getAdminBoards,
  updateAdminBoard,
} from '@/apis/admin/boards';

// 관리자 - 게시판 관리 상태
//
// isLoading / data / error 세 개를 한 세트로 관리한다.
//  - isLoading : 요청 시작에 true, 끝나면 성공·실패 상관없이 finally 에서 반드시 false
//  - data      : 게시판 목록. 서버가 돌려준 값을 그대로 담는다
//  - error     : 화면에 그대로 띄울 한국어 문장 (성공하면 null 로 비운다)
//
// 서버가 실패 응답에 담아주는 문장(예: '이미 존재하는 게시판 이름입니다.')이 이미 사용자용이라
// getErrorMessage 로 그것을 먼저 쓰고, 없을 때만 아래 기본 문장을 쓴다.
const FALLBACK_MESSAGES = {
  fetch: '게시판 목록을 불러오지 못했습니다.',
  create: '게시판을 만들지 못했습니다.',
  update: '게시판 정보를 수정하지 못했습니다.',
  remove: '게시판을 삭제하지 못했습니다.',
};

const useAdminBoardStore = create((set, get) => ({
  isLoading: false,
  data: [],
  error: null,

  clearError: () => set({ error: null }),

  reset: () => set({ isLoading: false, data: [], error: null }),

  // 1. 게시판 목록 조회
  fetchBoards: async () => {
    set({ isLoading: true, error: null });
    try {
      const boards = await getAdminBoards();
      set({ data: boards });
      return boards;
    } catch (err) {
      set({ error: getErrorMessage(err, FALLBACK_MESSAGES.fetch) });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  // 2. 게시판 생성 - payload: { name, readScope, writeLevel }
  // 서버가 만들어진 게시판 정보를 돌려주므로 목록을 다시 불러오지 않고 뒤에 붙인다.
  createBoard: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const created = await createAdminBoard(payload);
      set({ data: [...get().data, created] });
      return created;
    } catch (err) {
      set({ error: getErrorMessage(err, FALLBACK_MESSAGES.create) });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  // 3. 게시판 수정 - payload 에 담은 필드만 바뀐다 (이름 · 권한 · 순서 등)
  // 응답이 게시판 정보 전체라 그것으로 해당 항목만 갈아끼운다. 값을 추측하지 않는다.
  updateBoard: async (boardId, payload) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await updateAdminBoard(boardId, payload);
      set({
        data: get().data.map((board) => (board.boardId === boardId ? updated : board)),
      });
      return updated;
    } catch (err) {
      set({ error: getErrorMessage(err, FALLBACK_MESSAGES.update) });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  // 4. 게시판 삭제 (소프트 삭제) - 응답은 { message } 뿐이다.
  // 소프트 삭제라 DB 에는 행이 남지만, GET /api/admin/boards 응답에는 나오지 않는 것을
  // 실제로 확인했다(삭제 후 재조회해도 없다). 그래서 재조회 없이 여기서 빼도 서버와 어긋나지 않는다.
  // 게시글이 남아 있으면 서버가 409 로 막고, 그 문장이 error 에 담긴다.
  deleteBoard: async (boardId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await deleteAdminBoard(boardId);
      set({ data: get().data.filter((board) => board.boardId !== boardId) });
      return result;
    } catch (err) {
      set({ error: getErrorMessage(err, FALLBACK_MESSAGES.remove) });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useAdminBoardStore;
