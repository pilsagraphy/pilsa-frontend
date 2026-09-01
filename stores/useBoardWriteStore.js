import { create } from 'zustand';

// 공통게시판 글쓰기/수정 폼 상태 (전역).
// 글쓰기 페이지와 수정(Edit) 페이지가 같은 폼을 공유하므로 전역으로 둔다.
// (수정 화면은 setForm 으로 기존 값을 채우고, 폼 컴포넌트는 이 값을 읽어 그린다)
const INITIAL = {
  title: '',
  content: '',
  categoryId: '',
  isAnonymous: false,

  // 이 요청에 새로 올릴 파일 (File 객체)
  files: [],

  // 수정 화면 전용 —
  // existingAttachments: 이미 글에 붙어 있는 첨부 [{ attachmentId, originName, fileUrl, fileSize }]
  // deleteAttachmentIds: 그중 사용자가 지우기로 표시한 id.
  //   서버는 증분 방식이라 '유지할 첨부'는 아무것도 보내지 않고, 지울 것만 보낸다.
  existingAttachments: [],
  deleteAttachmentIds: [],
};

const useBoardWriteStore = create((set) => ({
  ...INITIAL,

  setTitle: (title) => set({ title }),

  // 값 또는 업데이터 함수를 받는다.
  // 이미지 업로드가 끝난 뒤 본문의 자리표시자만 바꿔치기할 때, 그사이 사용자가 이어 친 내용을
  // 덮어쓰지 않으려면 '지금 값' 기준으로 고쳐야 해서 업데이터가 필요하다.
  setContent: (content) =>
    set((state) => ({
      content: typeof content === 'function' ? content(state.content) : content,
    })),
  setCategoryId: (categoryId) => set({ categoryId }),
  setIsAnonymous: (isAnonymous) => set({ isAnonymous }),
  setFiles: (files) => set({ files }),

  // 새로 고른 파일 중 하나만 빼기 (file input 은 전체 교체만 되므로 개별 제거는 여기서 처리한다)
  removeFileAt: (index) =>
    set((state) => ({ files: state.files.filter((_, i) => i !== index) })),

  // 기존 첨부 삭제 표시 토글 (실수로 눌러도 되돌릴 수 있게 토글로 둔다)
  toggleDeleteAttachment: (attachmentId) =>
    set((state) => ({
      deleteAttachmentIds: state.deleteAttachmentIds.includes(attachmentId)
        ? state.deleteAttachmentIds.filter((id) => id !== attachmentId)
        : [...state.deleteAttachmentIds, attachmentId],
    })),

  // 수정 화면 진입 시 기존 값으로 폼 채우기 (넘기지 않은 필드는 초기값)
  setForm: (form) => set({ ...INITIAL, ...form }),

  resetForm: () => set({ ...INITIAL }),
}));

export default useBoardWriteStore;
