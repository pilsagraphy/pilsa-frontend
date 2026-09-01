import { create } from 'zustand';

import { getErrorMessage } from '@/apis/auth';
import { createDraft, deleteDraft, getDraft, getDrafts, updateDraft } from '@/apis/draft';
import useAuthStore from '@/stores/useAuthStore';

// 공통게시판 임시저장(초안) 상태.
//
// isLoading / data / error 세 개를 항상 세트로 관리한다.
//  - isLoading : 요청 시작에 true, 끝나면 성공·실패 상관없이 finally 에서 반드시 false
//  - data      : 임시저장 목록. 서버가 준 값을 그대로 담는다
//                (응답에 count 필드가 없어 개수는 data.length 로 센다)
//  - error     : 화면에 그대로 띄울 한국어 문장 (요청 시작 시 null 로 비운다)
//
// 이 목록은 '그 사람이 그 게시판에 쓰던 초안'이다. 그래서 어느 게시판·누구 것인지를
// 함께 들고 있다가 둘 중 하나라도 달라지면 버린다.
//  - 게시판이 바뀌면: 개수('저장 | N')가 다른 게시판 것으로 보인다
//  - 계정이 바뀌면: 새로 받아오기 전까지 이전 사람의 초안 제목·개수가 그대로 보인다
const FALLBACK_MESSAGES = {
  fetch: '임시저장 목록을 불러오지 못했습니다.',
  save: '임시저장에 실패했습니다.',
  load: '임시저장한 글을 불러오지 못했습니다.',
  remove: '임시저장한 글을 삭제하지 못했습니다.',
};

const currentUserId = () => useAuthStore.getState().user?.userId ?? null;

const useDraftStore = create((set, get) => ({
  isLoading: false,
  data: [],
  error: null,

  // 지금 담고 있는 목록이 어느 게시판·누구 것인지
  boardId: null,
  ownerUserId: null,

  // 1. 목록 조회 (GET .../drafts)
  // '저장 | N' 개수와 불러오기 모달이 같은 목록을 쓴다.
  fetchDrafts: async (boardId) => {
    const owner = currentUserId();

    // 게시판이나 계정이 달라졌으면 이전 목록을 먼저 버린다.
    // 안 버리면 응답이 오기 전까지 남의(또는 다른 게시판의) 개수와 제목이 그대로 보인다.
    const isSameList = String(get().boardId) === String(boardId) && get().ownerUserId === owner;

    set({
      isLoading: true,
      error: null,
      boardId,
      ownerUserId: owner,
      ...(isSameList ? {} : { data: [] }),
    });

    // 이 요청이 아직 최신인지. 게시판을 옮기면 이전 요청이 뒤늦게 도착해
    // 새 게시판 화면에 이전 게시판 목록을 써버릴 수 있다.
    const isStale = () =>
      String(get().boardId) !== String(boardId) || get().ownerUserId !== owner;

    try {
      const result = await getDrafts(boardId);
      const drafts = Array.isArray(result?.drafts) ? result.drafts : [];
      if (isStale()) return drafts;

      set({ data: drafts });
      return drafts;
    } catch (err) {
      if (isStale()) return null;

      set({ error: getErrorMessage(err, FALLBACK_MESSAGES.fetch) });
      return null;
    } finally {
      // 뒤처진 요청이 최신 요청의 로딩 표시를 끄지 않게 한다
      if (!isStale()) set({ isLoading: false });
    }
  },

  // 2. 저장 — draftId 가 있으면 덮어쓰기(PUT, 슬롯 유지), 없으면 새로 만든다(POST).
  // 성공하면 draftId 를 돌려준다 (생성은 응답값, 덮어쓰기는 받은 값 그대로).
  // 실패도 null 을 돌려주므로, 부르는 쪽은 error 를 함께 확인한다.
  //   상한(5개)을 넘기면 서버가 409 와 안내 문장을 준다 → 그 문장이 error 에 담긴다.
  saveDraft: async (boardId, draftId, body) => {
    set({ isLoading: true, error: null });
    try {
      if (draftId) {
        await updateDraft(boardId, draftId, body);
        return draftId;
      }

      const created = await createDraft(boardId, body);
      return created?.draftId ?? null;
    } catch (err) {
      set({ error: getErrorMessage(err, FALLBACK_MESSAGES.save) });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  // 3. 단건 조회 (GET .../drafts/{draftId}) — 이어쓰기용 전체 복원.
  // 목록에는 preview(앞 20자)만 있어 본문을 채울 수 없다. 그래서 고른 뒤 따로 받는다.
  loadDraft: async (boardId, draftId) => {
    set({ isLoading: true, error: null });
    try {
      const detail = await getDraft(boardId, draftId);
      return detail;
    } catch (err) {
      set({ error: getErrorMessage(err, FALLBACK_MESSAGES.load) });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  // 4. 삭제 (DELETE .../drafts/{draftId}) — 물리 삭제.
  // DB 행은 물론 선업로드된 본문 이미지·첨부의 디스크 파일까지 서버가 지운다
  // (소프트 삭제 대전제의 예외 — 발행 전 개인 작업물이라서).
  //
  // ※ 아직 부르는 곳이 없다. 시안의 불러오기 모달에 삭제 버튼이 없어서다.
  //    상한(5개)에 닿으면 지울 방법이 없으면 더 저장할 수 없으니 삭제 UI 논의가 필요하다.
  removeDraft: async (boardId, draftId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await deleteDraft(boardId, draftId);
      set({ data: get().data.filter((draft) => draft.draftId !== draftId) });
      return result;
    } catch (err) {
      set({ error: getErrorMessage(err, FALLBACK_MESSAGES.remove) });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useDraftStore;
