import { create } from 'zustand';

export const useInfoWriteStore = create((set) => ({
  title: '',
  file: null,
  category: '',
  content: '',
  isImportant: false,

  // 상태 변경 액션
  setTitle: (title) => set({ title }),
  setFile: (file) => set({ file }),
  setCategory: (category) => set({ category }),
  setContent: (content) => set({ content }),
  setIsImportant: (isImportant) => set({ isImportant }),

  // 폼 초기화 액션
  resetForm: () =>
    set({
      title: '',
      file: null,
      category: '',
      content: '',
      isImportant: false,
    }),
}));
