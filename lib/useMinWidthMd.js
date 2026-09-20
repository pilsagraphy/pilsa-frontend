'use client';

import { useSyncExternalStore } from 'react';

// 폰 디자인은 1280px(xl) 아래까지 쓴다 (PM, 2026-09-20). 사이드바가 폭을 가져가는 태블릿·좁은 PC 구간에서 PC 표가 늘 잘렸다.
// 이름은 그대로 두었다 — 부르는 곳이 아홉 군데라 이름을 바꾸면 머지 충돌만 늘어난다
const MD_QUERY = '(min-width: 1280px)';

function subscribe(onChange) {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia(MD_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

function getSnapshot() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(MD_QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

/** 뷰포트가 'PC 디자인' 구간(1280px, Tailwind xl) 이상인지. 그 아래는 폰 디자인을 쓴다 */
export function useMinWidthMd() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
