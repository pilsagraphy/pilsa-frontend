import { create } from 'zustand';

export const useFreeWriteStore = create((set) => ({
  title: '',
  file: '',
  category: '',
  content: '',
  isAnonymous: false,

  // 👇 개별 상태 변경 함수들 추가 👇
  setTitle: (title) => set({ title }),
  setFile: (file) => set({ file }),
  setCategory: (category) => set({ category }),
  setContent: (content) => set({ content }),
  setIsAnonymous: (isAnonymous) => set({ isAnonymous }),

  resetForm: () =>
    set({
      title: '',
      file: '',
      category: '',
      content: '',
      isAnonymous: false,
    }),
}));
