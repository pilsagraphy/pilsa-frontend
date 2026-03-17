import { create } from 'zustand';

export const useInfoWriteStore = create((set) => ({
  title: '',
  content: '',
  categoryId: '',
  files: [],

  setTitle: (title) => set({ title }),
  setContent: (content) => set({ content }),
  setCategoryId: (categoryId) => set({ categoryId }),
  setFiles: (files) => set({ files }),

  setForm: ({ title = '', content = '', categoryId = '', files = [] }) =>
    set({
      title,
      content,
      categoryId,
      files,
    }),

  resetForm: () =>
    set({
      title: '',
      content: '',
      categoryId: '',
      files: [],
    }),
}));
