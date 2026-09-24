import { create } from 'zustand';

const useSidebarStore = create((set) => ({
  // 폰에서 사이드바가 펼쳐져 있는가. 여는 버튼은 헤더에, 닫는 버튼과 본체는 Sidebar 에 있어 상태를 여기 둔다
  isMobileOpen: false,
  openMobile: () => set({ isMobileOpen: true }),
  closeMobile: () => set({ isMobileOpen: false }),
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
