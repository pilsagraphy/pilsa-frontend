import { create } from 'zustand';

const useNoticeStore = create((set) => ({
  title: '',
  file: null,
  isImportant: 'none', 
  content: '',
  setTitle: (title) => set({ title }),
  setFile: (file) => set({ file }),
  setIsImportant: (isImportant) => set({ isImportant }),
  setContent: (content) => set({ content }),
  resetForm: () => set({ title: '', file: null, isImportant: 'none', content: '' })
}));

export default useNoticeStore;