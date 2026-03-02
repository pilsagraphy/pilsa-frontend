import { create } from 'zustand';

const useSidebarStore = create((set) => ({
  isLoggedIn: false, // 로그인 상태
  openMenus: {
    about: true, // 기본적으로 ABOUT PILSA가 열려있는 상태로 가정
    board: false,
  },
  toggleLogin: () => set((state) => ({ isLoggedIn: !state.isLoggedIn })),
  toggleMenu: (menu) =>
    set((state) => ({
      openMenus: { ...state.openMenus, [menu]: !state.openMenus[menu] },
    })),
}));

export default useSidebarStore;
