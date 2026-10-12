import { isIOS } from '@/lib/platform';

// 폰에서 화면을 쓸어 사이드바 열기 — 마이페이지 > 설정 > 화면 에서 켜고 끈다 (PM 2026-10-12, 단톡 의견 "설정에서 선택할 수 있게").
// 기본값만 기기별로 다르다:
//  - 아이폰(iPadOS 포함): 기본 끔. 왼쪽 가장자리에서 쓸면 OS 뒤로가기인데, 살짝만 쓸면 사이드바가 같이 튀어나왔다 (아이폰 테스터 제보).
//  - 그 밖(갤럭시 등): 기본 켬.
// 고른 값은 이 기기(브라우저)에만 저장된다. 'on' / 'off' 를 직접 고른 적이 없으면 기기 기본값.
const KEY = 'pilsaSidebarSwipe';

const defaultOn = () => !isIOS();

export const isSidebarSwipeEnabled = () => {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'on') return true;
    if (saved === 'off') return false;
  } catch {
    // 저장소를 못 쓰면 기기 기본값
  }
  return defaultOn();
};

export const setSidebarSwipeEnabled = (on) => {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    // 저장 못 하면 이번 화면에서만 바뀐 것처럼 보이고 다음엔 기본값
  }
};
