import { isIOS } from '@/lib/platform';

// 폰에서 화면을 쓸어 사이드바 열기 — 기기별로 다르게 (PM 2026-10-12, 단톡 의견 "설정에서 선택할 수 있게").
//  - 아이폰: 늘 끈다. 왼쪽 가장자리에서 쓸면 OS 뒤로가기인데, 살짝만 쓸면 사이드바가 같이 튀어나왔다 (아이폰 테스터 제보).
//    설정 화면에도 스위치를 보이지 않는다.
//  - 그 밖(갤럭시 등): 기본 켬, 마이페이지 > 설정 > 화면 에서 끌 수 있다. 이 기기(브라우저)에만 저장된다.
const KEY = 'pilsaSidebarSwipe'; // 'off' 일 때만 꺼짐

export const canChooseSidebarSwipe = () => typeof window !== 'undefined' && !isIOS();

export const isSidebarSwipeEnabled = () => {
  if (!canChooseSidebarSwipe()) return false;
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
};

export const setSidebarSwipeEnabled = (on) => {
  try {
    if (on) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, 'off');
  } catch {
    // 저장소를 못 쓰면 기본값(켬)으로 남는다
  }
};
