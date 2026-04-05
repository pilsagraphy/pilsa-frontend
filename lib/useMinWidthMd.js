'use client';

import { useSyncExternalStore } from 'react';

const MD_QUERY = '(min-width: 768px)';

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

/** 뷰포트가 Tailwind `md`(768px) 이상인지 (모바일·좁은 웹 구간 구분용) */
export function useMinWidthMd() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
