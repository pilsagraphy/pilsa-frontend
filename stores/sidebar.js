import { create } from 'zustand';

const useSidebarStore = create((set) => ({
  isLoggedIn: false, // 로그인 상태
  openMenus: {
    about: true, // 기본적으로 ABOUT PILSA가 열려있는 상태로 가정
    board: true, // 게시판도 기본 확장
    members: true, // 관리자: 회원관리 기본 확장
    community: true, // 관리자: 커뮤니티 관리 기본 확장
  },
  toggleLogin: () => set((state) => ({ isLoggedIn: !state.isLoggedIn })),
  toggleMenu: (menu) =>
    set((state) => ({
      openMenus: { ...state.openMenus, [menu]: !state.openMenus[menu] },
    })),
}));

export default useSidebarStore;
