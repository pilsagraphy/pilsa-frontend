import { create } from 'zustand';

export const useFreeWriteStore = create((set) => ({
  title: '',
  files: [],
  categoryId: '',
  content: '',
  isAnonymous: false,

  setTitle: (title) => set({ title }),
  setFiles: (files) => set({ files }),
  setCategoryId: (categoryId) => set({ categoryId }),
  setContent: (content) => set({ content }),
  setIsAnonymous: (isAnonymous) => set({ isAnonymous }),

  setForm: ({ title = '', files = [], categoryId = '', content = '', isAnonymous = false }) =>
    set({
      title,
      files,
      categoryId,
      content,
      isAnonymous,
    }),

  resetForm: () =>
    set({
      title: '',
      files: [],
      categoryId: '',
      content: '',
      isAnonymous: false,
    }),
}));
