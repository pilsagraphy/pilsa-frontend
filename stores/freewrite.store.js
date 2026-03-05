import { create } from 'zustand';

export const useFreeWriteStore = create((set) => ({
  title: '',
  file: '',
  category: '',
  content: '',
  isAnonymous: false,

  setField: (field, value) => set((state) => ({ ...state, [field]: value })),

  resetForm: () =>
    set({
      title: '',
      file: '',
      category: '',
      content: '',
      isAnonymous: false,
    }),
}));
