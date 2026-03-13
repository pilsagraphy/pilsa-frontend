import { create } from 'zustand';

export const useFreeWriteStore = create((set) => ({
  // 초기 상태
  title: '',
  file: null, // 파일은 문자열이 아닌 null로 시작하는 게 정석입니다.
  category: '', // 카테고리 추가
  content: '',
  isAnonymous: false,

  // 개별 변경 함수
  setTitle: (title) => set({ title }),
  setFile: (file) => set({ file }),
  setCategory: (category) => set({ category }),
  setContent: (content) => set({ content }),
  setIsAnonymous: (isAnonymous) => set({ isAnonymous }),

  // 폼 초기화: 페이지 진입 시나 글 작성 완료 후 호출
  resetForm: () =>
    set({
      title: '',
      file: null,
      category: '',
      content: '',
      isAnonymous: false,
    }),
}));
