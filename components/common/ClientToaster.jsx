'use client';

import { Toaster } from 'sonner';

export default function ClientToaster() {
  // 머무는 시간은 lib/toast 가 글 길이로 정한다(짧은 안내 1초 · 긴 문장 3초). 여기 duration 은 그 래퍼를 거치지 않은
  // 호출의 기본값이다. 그 전에 치우고 싶으면 위·좌·우 어느 쪽으로든 쓸어 넘긴다 (PM, 2026-09-23~24)
  return <Toaster position="top-center" duration={1000} swipeDirections={['top', 'left', 'right']} />;
}
