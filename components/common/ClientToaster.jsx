'use client';

import { Toaster } from 'sonner';

export default function ClientToaster() {
  // 모든 토스트는 1초면 사라진다 — "새 일정이 등록되었습니다" 같은 안내가 오래 남아 화면을 가렸다 (PM, 2026-09-23).
  // 그 전에 치우고 싶으면 위·좌·우 어느 쪽으로든 쓸어 넘긴다. 호출부에서 duration 을 따로 준 곳은 없다(전수 확인)
  return <Toaster position="top-center" duration={1000} swipeDirections={['top', 'left', 'right']} />;
}
